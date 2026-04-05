// ============================================================
// AETHER k6 Load Testing
// Target: p99 <250ms at 10K concurrent users
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const forecastLatency = new Trend('forecast_latency');
const radarLatency = new Trend('radar_latency');
const alertLatency = new Trend('alert_latency');

// Test locations
const LOCATIONS = [
  { lat: 30.83, lon: -83.28, name: 'Valdosta' },
  { lat: 40.71, lon: -74.01, name: 'NYC' },
  { lat: 39.74, lon: -104.99, name: 'Denver' },
  { lat: 25.76, lon: -80.19, name: 'Miami' },
  { lat: 47.61, lon: -122.33, name: 'Seattle' },
  { lat: 41.88, lon: -87.63, name: 'Chicago' },
  { lat: 33.45, lon: -112.07, name: 'Phoenix' },
  { lat: 29.76, lon: -95.37, name: 'Houston' },
  { lat: 34.05, lon: -118.24, name: 'LA' },
  { lat: 42.36, lon: -71.06, name: 'Boston' },
];

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export const options = {
  scenarios: {
    // Ramp up to peak load
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },    // Warm up
        { duration: '5m', target: 500 },    // Moderate load
        { duration: '5m', target: 1000 },   // High load
        { duration: '3m', target: 2000 },   // Peak load
        { duration: '2m', target: 0 },      // Cool down
      ],
    },
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      startTime: '20m',
      stages: [
        { duration: '30s', target: 5000 },  // Sudden spike
        { duration: '1m', target: 5000 },   // Sustain
        { duration: '30s', target: 0 },     // Drop
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:current}': ['p(99)<250'],
    'http_req_duration{endpoint:hourly}': ['p(99)<500'],
    'http_req_duration{endpoint:alerts}': ['p(99)<200'],
    'errors': ['rate<0.01'], // <1% error rate
  },
};

export default function () {
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

  // Current conditions (most common request)
  const currentRes = http.get(
    `${BASE_URL}/v1/weather/current?lat=${loc.lat}&lon=${loc.lon}`,
    { tags: { endpoint: 'current' } },
  );
  check(currentRes, {
    'current: status 200': (r) => r.status === 200,
    'current: has temp': (r) => JSON.parse(r.body).data?.temp !== undefined,
  });
  forecastLatency.add(currentRes.timings.duration);
  errorRate.add(currentRes.status !== 200);

  sleep(0.5);

  // Hourly forecast
  const hourlyRes = http.get(
    `${BASE_URL}/v1/weather/hourly?lat=${loc.lat}&lon=${loc.lon}`,
    { tags: { endpoint: 'hourly' } },
  );
  check(hourlyRes, {
    'hourly: status 200': (r) => r.status === 200,
    'hourly: has data array': (r) => Array.isArray(JSON.parse(r.body).data),
  });
  forecastLatency.add(hourlyRes.timings.duration);

  sleep(0.3);

  // Alerts
  const alertRes = http.get(
    `${BASE_URL}/v1/weather/alerts?lat=${loc.lat}&lon=${loc.lon}`,
    { tags: { endpoint: 'alerts' } },
  );
  check(alertRes, {
    'alerts: status 200': (r) => r.status === 200,
  });
  alertLatency.add(alertRes.timings.duration);

  sleep(1);

  // Health check (lightweight)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, _opts) {
  const p99Current = data.metrics?.['http_req_duration{endpoint:current}']?.values?.['p(99)'] || 'N/A';
  const p99Hourly = data.metrics?.['http_req_duration{endpoint:hourly}']?.values?.['p(99)'] || 'N/A';
  const errors = data.metrics?.errors?.values?.rate || 0;

  return `
=== AETHER Load Test Results ===
Current Conditions p99: ${p99Current}ms (target: <250ms)
Hourly Forecast p99: ${p99Hourly}ms (target: <500ms)
Error Rate: ${(errors * 100).toFixed(2)}% (target: <1%)
================================
`;
}
