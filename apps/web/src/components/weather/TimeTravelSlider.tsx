import { useState, useCallback, useRef } from 'react';
import type { HourlyForecast } from '@aether/shared';
import { roundTemp } from '@aether/weather-core';

interface TimeTravelSliderProps {
  hours: HourlyForecast[];
  onTimeChange: (index: number) => void;
}

export function TimeTravelSlider({ hours, onTimeChange }: TimeTravelSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(hours.length - 1, index));
      setActiveIndex(clamped);
      onTimeChange(clamped);
    },
    [hours.length, onTimeChange],
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      handleChange(Math.round(pct * (hours.length - 1)));
    },
    [handleChange, hours.length],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          handleChange(activeIndex + (e.shiftKey ? 3 : 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleChange(activeIndex - (e.shiftKey ? 3 : 1));
          break;
        case 'Home':
          e.preventDefault();
          handleChange(0);
          break;
        case 'End':
          e.preventDefault();
          handleChange(hours.length - 1);
          break;
      }
    },
    [activeIndex, handleChange, hours.length],
  );

  if (hours.length === 0) return null;

  const activeHour = hours[activeIndex]!;
  const maxTemp = Math.max(...hours.map((h) => h.temp));
  const minTemp = Math.min(...hours.map((h) => h.temp));

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--space-3)',
        }}
      >
        <h2
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Time Travel
        </h2>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {activeIndex === 0 ? 'Now' : formatTime(new Date(activeHour.time))}
        </span>
      </div>

      {/* Current time point info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: 'var(--space-3)',
          padding: 'var(--space-2) 0',
          background: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <MiniStat label="Temp" value={`${roundTemp(activeHour.temp)}\u00B0`} />
        <MiniStat label="Rain" value={`${activeHour.precipProb}%`} />
        <MiniStat label="Wind" value={`${Math.round(activeHour.windSpeed)} mph`} />
        <MiniStat label="Humidity" value={`${activeHour.humidity}%`} />
      </div>

      {/* Temperature sparkline */}
      <div
        style={{
          height: '40px',
          position: 'relative',
          marginBottom: 'var(--space-2)',
        }}
      >
        <svg width="100%" height="40" viewBox={`0 0 ${hours.length} 40`} preserveAspectRatio="none">
          {/* Temp line */}
          <polyline
            points={hours
              .map((h, i) => {
                const y = 38 - ((h.temp - minTemp) / (maxTemp - minTemp || 1)) * 36;
                return `${i},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Precip bars */}
          {hours.map((h, i) =>
            h.precipProb > 20 ? (
              <rect
                key={i}
                x={i - 0.3}
                y={40 - (h.precipProb / 100) * 15}
                width={0.6}
                height={(h.precipProb / 100) * 15}
                fill="#60A5FA"
                opacity={0.4}
              />
            ) : null,
          )}

          {/* Active marker */}
          <circle
            cx={activeIndex}
            cy={38 - ((activeHour.temp - minTemp) / (maxTemp - minTemp || 1)) * 36}
            r="3"
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Scrubber track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Time travel slider"
        aria-valuemin={0}
        aria-valuemax={hours.length - 1}
        aria-valuenow={activeIndex}
        onKeyDown={handleKeyDown}
        onClick={handleTrackClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => {
          if (!isDragging || !trackRef.current) return;
          const rect = trackRef.current.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          handleChange(Math.round(pct * (hours.length - 1)));
        }}
        style={{
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'var(--color-border)',
            borderRadius: 'var(--radius-full)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${(activeIndex / (hours.length - 1)) * 100}%`,
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-full)',
            }}
          />
          {/* Thumb */}
          <div
            style={{
              position: 'absolute',
              left: `${(activeIndex / (hours.length - 1)) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--color-accent)',
              border: '2px solid var(--color-surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
        </div>
      </div>

      {/* Time labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
        }}
      >
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Now</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
          +{hours.length}h
        </span>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFeatureSettings: "'tnum' on" }}>
        {value}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: undefined,
    hour12: true,
  });
}
