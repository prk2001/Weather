import type { DailyForecast, HourlyForecast } from '@aether/shared';
import { roundTemp, tempFontWeight } from '@aether/weather-core';
import { SEVERITY_COLORS } from '@aether/shared';

interface DetailPanelProps {
  day: DailyForecast | undefined;
  hourly: HourlyForecast[];
  dayIndex: number;
  onClose: () => void;
}

export function DetailPanel({ day, hourly, dayIndex, onClose }: DetailPanelProps) {
  if (!day) return null;

  const date = new Date(day.date);
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  const dayHours = hourly.filter((h) => {
    const t = new Date(h.time);
    return t >= dayStart && t <= dayEnd;
  });
  const hasHourly = dayHours.length >= 6;
  const dayLabel = dayIndex === 0 ? 'Today' : dayIndex === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '220px',
        left: 'var(--space-4)',
        zIndex: 18,
        width: '380px',
        maxHeight: '50vh',
        overflow: 'auto',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
        padding: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{dayLabel}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {day.narrative}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          &times;
        </button>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        background: 'var(--color-border)',
      }}>
        <StatCell label="High" value={`${roundTemp(day.tempHigh)}°`} color={tempColor(day.tempHigh)} />
        <StatCell label="Low" value={`${roundTemp(day.tempLow)}°`} color={tempColor(day.tempLow)} />
        <StatCell label="Rain" value={`${day.precipProb}%`} color={day.precipProb > 50 ? '#3B82F6' : undefined} />
        <StatCell label="UV" value={`${day.uvIndexMax}`} color={day.uvIndexMax >= 8 ? SEVERITY_COLORS.orange : undefined} />
      </div>

      {/* Sun/Moon row */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span>&#x2600;&#xFE0F; {fmtTime(day.sunrise)}</span>
        <span>&#x1F319; {fmtTime(day.sunset)}</span>
        <span>&#x1F4A8; {day.windSpeed} mph</span>
        {day.windGust && <span>Gusts {day.windGust}</span>}
      </div>

      {/* Hourly breakdown if available */}
      {hasHourly ? (
        <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
            Hourly Breakdown
          </div>
          <div style={{ display: 'flex', gap: '1px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {dayHours.map((h, i) => {
              const t = new Date(h.time);
              return (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  minWidth: '38px',
                  padding: '4px 2px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>
                    {fmtHour(t.getHours())}
                  </span>
                  <span style={{ fontSize: '0.8rem' }}>
                    {getEmoji(h.condition, t.getHours())}
                  </span>
                  {h.precipProb > 10 && (
                    <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#60A5FA' }}>
                      {h.precipProb}%
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: tempFontWeight(h.temp),
                    fontFeatureSettings: "'tnum' on",
                  }}>
                    {roundTemp(h.temp)}°
                  </span>
                  <span style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)' }}>
                    {Math.round(h.windSpeed)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          padding: 'var(--space-4)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.8rem',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>&#x1F512;</div>
          Hourly breakdown not available for this day.
          <br />
          <span style={{ color: 'var(--color-gold)', fontWeight: 600, cursor: 'pointer' }}>
            Upgrade to Pro for 14-day hourly forecasts
          </span>
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--color-surface-solid)',
      padding: 'var(--space-2) var(--space-3)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: color || 'var(--color-text)', fontFeatureSettings: "'tnum' on" }}>{value}</div>
    </div>
  );
}

function tempColor(temp: number): string {
  if (temp >= 90) return SEVERITY_COLORS.red;
  if (temp >= 80) return SEVERITY_COLORS.orange;
  if (temp >= 70) return SEVERITY_COLORS.yellow;
  if (temp >= 50) return SEVERITY_COLORS.green;
  return '#60A5FA';
}

function fmtTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtHour(h: number): string {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function getEmoji(condition: string, hour: number): string {
  const night = hour < 6 || hour >= 20;
  switch (condition) {
    case 'clear': return night ? '\u{1F319}' : '\u2600\uFE0F';
    case 'partly_cloudy': return night ? '\u{1F319}' : '\u26C5';
    case 'mostly_cloudy': case 'overcast': return '\u2601\uFE0F';
    case 'light_rain': case 'drizzle': return '\u{1F326}\uFE0F';
    case 'rain': case 'heavy_rain': return '\u{1F327}\uFE0F';
    case 'thunderstorm': return '\u26C8\uFE0F';
    case 'snow': case 'light_snow': return '\u{1F328}\uFE0F';
    default: return '\u2601\uFE0F';
  }
}
