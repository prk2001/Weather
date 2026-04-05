import { useState } from 'react';
import type { HourlyForecast } from '@aether/shared';
import { roundTemp } from '@aether/weather-core';
import { getGridPoint, fetchHourlyForecast } from '../../lib/nws-api';

interface TripPlannerProps {
  onClose: () => void;
}

interface TripPoint {
  name: string;
  lat: number;
  lon: number;
  milesFromStart: number;
  arrivalTime: Date;
  weather?: HourlyForecast;
}

// Predefined route waypoints for demo — in production these come from a routing API
const ROUTES: Record<string, { name: string; points: { name: string; lat: number; lon: number; miles: number }[] }> = {
  'valdosta-atlanta': {
    name: 'Valdosta to Atlanta',
    points: [
      { name: 'Valdosta, GA', lat: 30.8327, lon: -83.2785, miles: 0 },
      { name: 'Tifton, GA', lat: 31.4505, lon: -83.5085, miles: 60 },
      { name: 'Cordele, GA', lat: 31.9635, lon: -83.7741, miles: 110 },
      { name: 'Macon, GA', lat: 32.8407, lon: -83.6324, miles: 175 },
      { name: 'Atlanta, GA', lat: 33.749, lon: -84.388, miles: 245 },
    ],
  },
  'valdosta-jacksonville': {
    name: 'Valdosta to Jacksonville',
    points: [
      { name: 'Valdosta, GA', lat: 30.8327, lon: -83.2785, miles: 0 },
      { name: 'Lake City, FL', lat: 30.1899, lon: -82.6393, miles: 75 },
      { name: 'Jacksonville, FL', lat: 30.3322, lon: -81.6557, miles: 145 },
    ],
  },
  'valdosta-tallahassee': {
    name: 'Valdosta to Tallahassee',
    points: [
      { name: 'Valdosta, GA', lat: 30.8327, lon: -83.2785, miles: 0 },
      { name: 'Quitman, GA', lat: 30.7852, lon: -83.5607, miles: 25 },
      { name: 'Tallahassee, FL', lat: 30.4383, lon: -84.2807, miles: 110 },
    ],
  },
};

export function TripPlanner({ onClose }: TripPlannerProps) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  });
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [speedMph] = useState(75); // posted speed + 10%

  const calculateTrip = async (routeKey: string) => {
    const route = ROUTES[routeKey];
    if (!route) return;

    setLoading(true);
    setSelectedRoute(routeKey);

    const departure = new Date(departureTime);
    const points: TripPoint[] = route.points.map((p) => ({
      name: p.name,
      lat: p.lat,
      lon: p.lon,
      milesFromStart: p.miles,
      arrivalTime: new Date(departure.getTime() + (p.miles / speedMph) * 3600000),
    }));

    // Fetch weather for each waypoint in parallel
    try {
      const weatherPromises = points.map(async (point) => {
        try {
          const grid = await getGridPoint(point.lat, point.lon);
          const hourly = await fetchHourlyForecast(grid);
          // Find the hour closest to arrival time
          const arrival = point.arrivalTime.getTime();
          const closest = hourly.reduce((best, h) => {
            const diff = Math.abs(new Date(h.time).getTime() - arrival);
            const bestDiff = Math.abs(new Date(best.time).getTime() - arrival);
            return diff < bestDiff ? h : best;
          });
          return { ...point, weather: closest };
        } catch {
          return point; // No weather data for this point
        }
      });

      const results = await Promise.all(weatherPromises);
      setTripPoints(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface-solid)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{'🚗'} Trip Weather</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              See what weather you'll drive through at {speedMph} mph
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Departure time picker */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Departure time
          </label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '6px',
              padding: '8px 12px',
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Route selection */}
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
            Select route
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(ROUTES).map(([key, route]) => (
              <button
                key={key}
                onClick={() => calculateTrip(key)}
                disabled={loading}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: selectedRoute === key ? 'rgba(124, 109, 240, 0.1)' : 'var(--color-surface-elevated)',
                  border: selectedRoute === key ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-text)',
                  cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{route.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {route.points[route.points.length - 1]!.miles} mi {'·'}{' '}
                  {Math.round(route.points[route.points.length - 1]!.miles / speedMph * 60)} min
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ animation: 'pulse 1.5s ease infinite', fontSize: '1.5rem', marginBottom: '8px' }}>{'🚗'}</div>
            Fetching weather along your route...
          </div>
        )}

        {/* Trip results */}
        {!loading && tripPoints.length > 0 && (
          <div style={{ padding: '0 var(--space-5) var(--space-5)' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}>
              Weather along your route
            </div>

            {/* Route timeline */}
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: '7px',
                top: '8px',
                bottom: '8px',
                width: '2px',
                background: 'var(--color-border)',
                borderRadius: '1px',
              }} />

              {tripPoints.map((point, i) => {
                const w = point.weather;
                const isStart = i === 0;
                const isEnd = i === tripPoints.length - 1;
                const conditionLabel = w ? formatCondition(w.condition) : '\u2014';
                const hasRain = w && w.precipProb > 30;
                const hasStorm = w && (w.condition === 'thunderstorm' || w.condition === 'severe_thunderstorm');

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      marginBottom: i < tripPoints.length - 1 ? 'var(--space-4)' : 0,
                      position: 'relative',
                    }}
                  >
                    {/* Dot on timeline */}
                    <div style={{
                      position: 'absolute',
                      left: '-16px',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: hasStorm ? 'var(--color-severity-red)'
                        : hasRain ? 'var(--color-severity-yellow)'
                        : isStart || isEnd ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      border: '2px solid var(--color-surface-solid)',
                    }} />

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{point.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFeatureSettings: "'tnum' on" }}>
                          {point.arrivalTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>

                      {w ? (
                        <div style={{
                          display: 'flex',
                          gap: 'var(--space-3)',
                          marginTop: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                        }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                            {roundTemp(w.temp)}{'°'}
                          </span>
                          <span>{conditionLabel}</span>
                          {w.precipProb > 10 && (
                            <span style={{ color: w.precipProb > 50 ? 'var(--color-severity-orange)' : '#60A5FA' }}>
                              {w.precipProb}% rain
                            </span>
                          )}
                          <span>{'💨'} {Math.round(w.windSpeed)} mph</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Weather data unavailable
                        </div>
                      )}

                      {/* Warning for bad conditions */}
                      {hasStorm && (
                        <div style={{
                          marginTop: '6px',
                          padding: '4px 10px',
                          background: 'rgba(248, 113, 113, 0.1)',
                          border: '1px solid rgba(248, 113, 113, 0.2)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          color: 'var(--color-severity-red)',
                          fontWeight: 600,
                        }}>
                          {'⚠️'} Thunderstorms expected — consider delaying departure
                        </div>
                      )}
                      {!hasStorm && hasRain && (
                        <div style={{
                          marginTop: '6px',
                          padding: '4px 10px',
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.15)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          color: '#60A5FA',
                        }}>
                          {'🌧️'} Rain likely — reduce speed and increase following distance
                        </div>
                      )}

                      {/* Mile marker */}
                      <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                        {point.milesFromStart === 0 ? 'Start' : `${point.milesFromStart} miles`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trip summary */}
            {tripPoints.length > 0 && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>
                  {tripPoints.some((p) => p.weather?.condition === 'thunderstorm')
                    ? '🚨 Storms on route — drive carefully'
                    : tripPoints.some((p) => p.weather && p.weather.precipProb > 30)
                      ? '🌧️ Some rain expected along the route'
                      : '\u2705 Clear driving conditions expected'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                  {Math.round(tripPoints[tripPoints.length - 1]!.milesFromStart / speedMph * 60)} min total
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCondition(condition: string): string {
  return condition.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
