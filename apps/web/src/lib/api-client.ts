// ============================================================
// AETHER API Client
// Wraps fetch calls to the API gateway with caching + fallback
// ============================================================

import type { CurrentConditions, HourlyForecast, DailyForecast, WeatherAlert, ApiResponse } from '@aether/shared';

const API_BASE = '/api'; // Proxied to localhost:4000/v1 via Vite

interface FetchOptions {
  signal?: AbortSignal;
}

async function get<T>(path: string, params: Record<string, string | number>, opts?: FetchOptions): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    signal: opts?.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export const weatherApi = {
  async getCurrent(lat: number, lon: number, opts?: FetchOptions): Promise<ApiResponse<CurrentConditions>> {
    return get('/weather/current', { lat, lon }, opts);
  },

  async getHourly(lat: number, lon: number, opts?: FetchOptions): Promise<ApiResponse<HourlyForecast[]>> {
    return get('/weather/hourly', { lat, lon }, opts);
  },

  async getDaily(lat: number, lon: number, opts?: FetchOptions): Promise<ApiResponse<DailyForecast[]>> {
    return get('/weather/daily', { lat, lon }, opts);
  },

  async getAlerts(lat: number, lon: number, opts?: FetchOptions): Promise<ApiResponse<WeatherAlert[]>> {
    return get('/weather/alerts', { lat, lon }, opts);
  },
};

// ── Geolocation helper ───────────────────────────────────────

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // 5 min cache
    });
  });
}

// ── Reverse geocoding (simple fallback) ──────────────────────

const LOCATION_NAMES: Record<string, string> = {
  '30.83,-83.28': 'Valdosta, GA',
  '40.71,-74.01': 'New York, NY',
  '39.74,-104.99': 'Denver, CO',
  '25.76,-80.19': 'Miami, FL',
  '47.61,-122.33': 'Seattle, WA',
  '41.88,-87.63': 'Chicago, IL',
};

export function reverseGeocode(lat: number, lon: number): string {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  return LOCATION_NAMES[key] || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
