import { useRef } from 'react';
import type { HourlyForecast } from '@aether/shared';
import { roundTemp } from '@aether/weather-core';
import { tempFontWeight } from '@aether/weather-core';
import { SEVERITY_COLORS } from '@aether/shared';

interface HourlyTimelineProps {
  hours: HourlyForecast[];
}

export function HourlyTimeline({ hours }: HourlyTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (hours.length === 0) return null;

  const maxTemp = Math.max(...hours.map((h) => h.temp));
  const minTemp = Math.min(...hours.map((h) => h.temp));
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4) 0',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <h2
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 var(--space-4) var(--space-3)',
        }}
      >
        Hourly Forecast
      </h2>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          overflowX: 'auto',
          padding: '0 var(--space-4) var(--space-2)',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {hours.slice(0, 24).map((hour, i) => {
          const time = new Date(hour.time);
          const isNow = i === 0;
          const isSunrise = time.getHours() === 6;
          const isSunset = time.getHours() === 19;
          const tempNorm = (hour.temp - minTemp) / tempRange;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                minWidth: '56px',
                padding: 'var(--space-2) var(--space-1)',
                borderRadius: 'var(--radius-md)',
                background: isNow ? 'var(--color-surface-elevated)' : 'transparent',
                scrollSnapAlign: 'start',
                transition: 'background var(--duration-fast) var(--ease-out)',
              }}
            >
              {/* Time label */}
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: isNow ? 700 : 400,
                  color: isNow ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {isNow ? 'Now' : formatHour(time)}
              </span>

              {/* Condition icon placeholder */}
              <span style={{ fontSize: '1.2rem' }}>
                {getConditionEmoji(hour.condition, time.getHours())}
              </span>

              {/* Precip probability */}
              {hour.precipProb > 10 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: precipColor(hour.precipProb),
                  }}
                >
                  {hour.precipProb}%
                </span>
              )}

              {/* Temperature bar visualization */}
              <div
                style={{
                  width: '4px',
                  height: '40px',
                  background: 'var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  position: 'relative',
                  marginTop: 'auto',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${Math.max(10, tempNorm * 100)}%`,
                    background: tempBarColor(hour.temp),
                    borderRadius: 'var(--radius-full)',
                    transition: 'height var(--duration-normal) var(--ease-out)',
                  }}
                />
              </div>

              {/* Temperature */}
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: tempFontWeight(hour.temp),
                  fontFeatureSettings: "'tnum' on",
                }}
              >
                {roundTemp(hour.temp)}°
              </span>

              {/* Sunrise/Sunset marker */}
              {(isSunrise || isSunset) && (
                <span style={{ fontSize: '0.6rem', color: '#F59E0B' }}>
                  {isSunrise ? '\u2600 Rise' : '\u263D Set'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatHour(date: Date): string {
  const h = date.getHours();
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function getConditionEmoji(condition: string, hour: number): string {
  const isNight = hour < 6 || hour >= 20;
  switch (condition) {
    case 'clear':
      return isNight ? '\u{1F319}' : '\u2600\uFE0F';
    case 'partly_cloudy':
      return isNight ? '\u{1F319}' : '\u26C5';
    case 'mostly_cloudy':
    case 'overcast':
      return '\u2601\uFE0F';
    case 'light_rain':
    case 'drizzle':
      return '\u{1F326}\uFE0F';
    case 'rain':
    case 'heavy_rain':
      return '\u{1F327}\uFE0F';
    case 'thunderstorm':
    case 'severe_thunderstorm':
      return '\u26C8\uFE0F';
    case 'snow':
    case 'light_snow':
    case 'heavy_snow':
      return '\u{1F328}\uFE0F';
    case 'fog':
      return '\u{1F32B}\uFE0F';
    default:
      return '\u2601\uFE0F';
  }
}

function precipColor(prob: number): string {
  if (prob >= 70) return SEVERITY_COLORS.orange;
  if (prob >= 40) return SEVERITY_COLORS.yellow;
  return '#60A5FA';
}

function tempBarColor(temp: number): string {
  if (temp >= 95) return SEVERITY_COLORS.red;
  if (temp >= 85) return SEVERITY_COLORS.orange;
  if (temp >= 70) return SEVERITY_COLORS.yellow;
  if (temp >= 50) return SEVERITY_COLORS.green;
  if (temp >= 32) return '#60A5FA';
  return '#2dd4bf';
}
