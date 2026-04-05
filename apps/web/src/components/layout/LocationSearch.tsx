import { useState } from 'react';
import { useWeatherStore } from '../../stores/weather';
import { getCurrentPosition } from '../../lib/api-client';

const PRESETS = [
  { name: 'Valdosta, GA', lat: 30.8327, lon: -83.2785 },
  { name: 'New York, NY', lat: 40.7128, lon: -74.006 },
  { name: 'Denver, CO', lat: 39.7392, lon: -104.9903 },
  { name: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
  { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
];

export function LocationSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const { fetchWeather, locationName } = useWeatherStore();

  const handleSelect = (lat: number, lon: number) => {
    fetchWeather(lat, lon);
    setIsOpen(false);
  };

  const handleGeolocate = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude } = pos.coords;
      fetchWeather(latitude, longitude);
      setIsOpen(false);
    } catch {
      // Silently fall back — user denied or unavailable
    } finally {
      setLocating(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-text)',
          fontSize: '0.95rem',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'inherit',
        }}
      >
        <span>{locationName || 'Select location...'}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {isOpen ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 'var(--space-1)',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Geolocation button */}
          <button
            onClick={handleGeolocate}
            disabled={locating}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: '2px solid var(--color-border)',
              color: 'var(--color-accent)',
              fontSize: '0.9rem',
              cursor: locating ? 'wait' : 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span>{locating ? '\u23F3' : '\u{1F4CD}'}</span>
            <span>{locating ? 'Locating...' : 'Use my location'}</span>
          </button>

          {PRESETS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleSelect(loc.lat, loc.lon)}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
