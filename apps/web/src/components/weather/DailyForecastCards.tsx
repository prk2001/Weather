import { useState } from 'react';
import type { DailyForecast, HourlyForecast } from '@aether/shared';
import { roundTemp, tempFontWeight } from '@aether/weather-core';
import { SEVERITY_COLORS } from '@aether/shared';

interface DailyForecastCardsProps {
  days: DailyForecast[];
  hourly: HourlyForecast[];
}

/**
 * Return hourly data that falls on the given date (in local timezone).
 * Only returns data if we have hourly coverage for that day.
 */
function getHoursForDay(date: Date, hourly: HourlyForecast[]): HourlyForecast[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return hourly.filter((h) => {
    const t = new Date(h.time);
    return t >= dayStart && t <= dayEnd;
  });
}

export function DailyForecastCards({ days, hourly }: DailyForecastCardsProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  if (days.length === 0) return null;

  const globalMax = Math.max(...days.map((d) => d.tempHigh));
  const globalMin = Math.min(...days.map((d) => d.tempLow));
  const range = globalMax - globalMin || 1;

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
      <h2
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 'var(--space-3)',
        }}
      >
        14-Day Forecast
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {days.map((day, i) => {
          const date = new Date(day.date);
          const isToday = i === 0;
          const isTomorrow = i === 1;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const highNorm = (day.tempHigh - globalMin) / range;
          const lowNorm = (day.tempLow - globalMin) / range;
          const isExpanded = expandedDay === i;
          const dayHours = getHoursForDay(date, hourly);
          const hasHourly = dayHours.length >= 6; // Need at least 6 hours to be useful

          return (
            <div key={i}>
              {/* Day row — clickable if hourly data available */}
              <div
                role={hasHourly ? 'button' : undefined}
                tabIndex={hasHourly ? 0 : undefined}
                onClick={() => {
                  if (hasHourly) {
                    setExpandedDay(isExpanded ? null : i);
                  }
                }}
                onKeyDown={(e) => {
                  if (hasHourly && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setExpandedDay(isExpanded ? null : i);
                  }
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 28px 1fr 40px 80px 40px',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  background: isExpanded
                    ? 'var(--color-surface-elevated)'
                    : isToday
                      ? 'var(--color-surface-elevated)'
                      : 'transparent',
                  cursor: hasHourly ? 'pointer' : 'default',
                  transition: 'background var(--duration-fast) var(--ease-out)',
                }}
              >
                {/* Day name + expand indicator */}
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isToday || isTomorrow || isExpanded ? 600 : 400,
                    color: isWeekend ? 'var(--color-accent)' : 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {hasHourly && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--color-text-muted)',
                        transition: 'transform var(--duration-fast) var(--ease-out)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                      }}
                    >
                      &#9654;
                    </span>
                  )}
                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDay(date)}
                </span>

                {/* Condition */}
                <span style={{ fontSize: '1.1rem', textAlign: 'center' }}>
                  {getConditionEmoji(day.condition)}
                </span>

                {/* Precip probability */}
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: day.precipProb > 30 ? precipColor(day.precipProb) : 'transparent',
                    textAlign: 'left',
                  }}
                >
                  {day.precipProb > 10 ? `${day.precipProb}%` : ''}
                </span>

                {/* Low temp */}
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    color: 'var(--color-text-muted)',
                    textAlign: 'right',
                    fontFeatureSettings: "'tnum' on",
                  }}
                >
                  {roundTemp(day.tempLow)}°
                </span>

                {/* Temperature range bar */}
                <div
                  style={{
                    height: '4px',
                    background: 'var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${lowNorm * 100}%`,
                      right: `${(1 - highNorm) * 100}%`,
                      height: '100%',
                      background: tempRangeGradient(day.tempLow, day.tempHigh),
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>

                {/* High temp */}
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: tempFontWeight(day.tempHigh),
                    textAlign: 'left',
                    fontFeatureSettings: "'tnum' on",
                  }}
                >
                  {roundTemp(day.tempHigh)}°
                </span>
              </div>

              {/* Expanded hourly breakdown */}
              {isExpanded && hasHourly && (
                <HourlyDrillDown hours={dayHours} day={day} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hourly Drill-Down Panel ──────────────────────────────────

function HourlyDrillDown({
  hours,
  day,
}: {
  hours: HourlyForecast[];
  day: DailyForecast;
}) {
  const maxTemp = Math.max(...hours.map((h) => h.temp));
  const minTemp = Math.min(...hours.map((h) => h.temp));
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div
      style={{
        background: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-md)',
        margin: '4px 0 8px 0',
        padding: 'var(--space-3)',
        overflow: 'hidden',
        animation: 'slideDown var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-3)',
          paddingBottom: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {day.narrative}
        </span>
      </div>

      {/* Sunrise/sunset info */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-3)',
          fontSize: '0.7rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>&#x2600;&#xFE0F; {formatTime(day.sunrise)}</span>
        <span>&#x1F319; {formatTime(day.sunset)}</span>
        {day.uvIndexMax >= 6 && (
          <span style={{ color: SEVERITY_COLORS.orange }}>
            UV {day.uvIndexMax}
          </span>
        )}
        {day.windGust && (
          <span>Gusts {day.windGust} mph</span>
        )}
      </div>

      {/* Hourly scrollable grid */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '2px',
        }}
      >
        {hours.map((hour, i) => {
          const time = new Date(hour.time);
          const h = time.getHours();
          const tempNorm = (hour.temp - minTemp) / tempRange;
          const isSunrise = h === new Date(day.sunrise).getHours();
          const isSunset = h === new Date(day.sunset).getHours();

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                minWidth: '42px',
                padding: '4px 2px',
                borderRadius: 'var(--radius-sm)',
                background:
                  isSunrise || isSunset
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'transparent',
              }}
            >
              {/* Hour */}
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  fontFeatureSettings: "'tnum' on",
                }}
              >
                {formatHour(h)}
              </span>

              {/* Condition */}
              <span style={{ fontSize: '0.9rem' }}>
                {getConditionEmoji(hour.condition)}
              </span>

              {/* Precip */}
              {hour.precipProb > 10 && (
                <span
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    color: precipColor(hour.precipProb),
                    fontFeatureSettings: "'tnum' on",
                  }}
                >
                  {hour.precipProb}%
                </span>
              )}

              {/* Temp bar */}
              <div
                style={{
                  width: '3px',
                  height: '28px',
                  background: 'var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  position: 'relative',
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
                  }}
                />
              </div>

              {/* Temp */}
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: tempFontWeight(hour.temp),
                  fontFeatureSettings: "'tnum' on",
                }}
              >
                {roundTemp(hour.temp)}°
              </span>

              {/* Wind */}
              <span
                style={{
                  fontSize: '0.5rem',
                  color: hour.windSpeed >= 15
                    ? SEVERITY_COLORS.orange
                    : 'var(--color-text-muted)',
                  fontFeatureSettings: "'tnum' on",
                }}
              >
                {Math.round(hour.windSpeed)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          fontSize: '0.55rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>Temp °F</span>
        <span>Wind mph</span>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatHour(h: number): string {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getConditionEmoji(condition: string): string {
  switch (condition) {
    case 'clear':
      return '\u2600\uFE0F';
    case 'partly_cloudy':
      return '\u26C5';
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

function tempRangeGradient(low: number, high: number): string {
  const lowColor =
    low < 32 ? '#2dd4bf' : low < 50 ? '#60A5FA' : low < 65 ? SEVERITY_COLORS.green : SEVERITY_COLORS.yellow;
  const highColor =
    high >= 95 ? SEVERITY_COLORS.red : high >= 85 ? SEVERITY_COLORS.orange : high >= 70 ? SEVERITY_COLORS.yellow : SEVERITY_COLORS.green;
  return `linear-gradient(to right, ${lowColor}, ${highColor})`;
}
