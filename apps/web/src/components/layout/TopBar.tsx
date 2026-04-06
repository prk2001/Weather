import { useState } from 'react';
import { useWeatherStore } from '../../stores/weather';

interface TopBarProps {
  onPremiumClick: () => void;
  onSearch: (lat: number, lon: number) => void;
  onTripClick?: () => void;
}

const PRESETS = [
  { name: 'Valdosta, GA', lat: 30.8327, lon: -83.2785 },
  { name: 'New York, NY', lat: 40.7128, lon: -74.006 },
  { name: 'Denver, CO', lat: 39.7392, lon: -104.9903 },
  { name: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
  { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
];

export function TopBar({ onPremiumClick, onSearch, onTripClick }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { locationName } = useWeatherStore();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)',
        gap: 'var(--space-3)',
        pointerEvents: 'none',
      }}
    >
      {/* AETHER logo — left */}
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          boxShadow: '0 2px 8px rgba(45, 212, 191, 0.3)',
        }}>
          {'☁'}
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            background: 'linear-gradient(135deg, #5eead4, #2dd4bf, #14b8a6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AETHER
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ pointerEvents: 'auto', position: 'relative', flex: 1, maxWidth: '280px' }}>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 12px',
            background: 'var(--color-surface)',
            backdropFilter: 'var(--blur-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>{'🔍'}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>{locationName || 'Search...'}</span>
        </button>
        {/* One-tap Find My Location — like Windy */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.geolocation?.getCurrentPosition(
              (pos) => { onSearch(pos.coords.latitude, pos.coords.longitude); setSearchOpen(false); },
              () => {},
              { enableHighAccuracy: true, timeout: 10000 },
            );
          }}
          title="Find my location"
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
            border: 'none',
            color: '#0b1117',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(45,212,191,0.3)',
          }}
        >
          {'◎'}
        </button>

        {searchOpen && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              overflow: 'hidden',
              animation: 'fadeIn var(--duration-normal) var(--ease-out)',
            }}
          >
            <button
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (pos) => { onSearch(pos.coords.latitude, pos.coords.longitude); setSearchOpen(false); },
                  () => {},
                );
              }}
              style={{
                width: '100%', padding: '8px 14px', background: 'none', border: 'none',
                borderBottom: '1px solid var(--color-border)', color: 'var(--color-accent)',
                fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              {'◎'} Use my location
            </button>
            {PRESETS.map((loc) => (
              <button
                key={loc.name}
                onClick={() => { onSearch(loc.lat, loc.lon); setSearchOpen(false); }}
                style={{
                  width: '100%', padding: '7px 14px', background: 'none', border: 'none',
                  borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)',
                  fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,109,240,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Trip planner button */}
      {onTripClick && (
        <button
          onClick={onTripClick}
          style={{
            pointerEvents: 'auto',
            padding: '6px 14px',
            background: 'var(--color-surface)',
            backdropFilter: 'var(--blur-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {'🚗'} Trip Weather
        </button>
      )}

      {/* Premium CTA */}
      <button
        onClick={onPremiumClick}
        style={{
          pointerEvents: 'auto',
          padding: '6px 16px',
          background: 'var(--color-gold-bg)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          color: '#1a1a2e',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 2px 10px rgba(232, 168, 76, 0.25)',
        }}
      >
        {'👑'} Premium
      </button>
    </div>
  );
}
