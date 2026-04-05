import type { HourlyForecast, DailyForecast } from '@aether/shared';
import { roundTemp } from '@aether/weather-core';
import { SEVERITY_COLORS } from '@aether/shared';
import type { ViewTab } from '../../App';
import { useRef } from 'react';

interface BottomTimelineProps {
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const TABS: { id: ViewTab; label: string; icon: string }[] = [
  { id: 'basic', label: 'Basic', icon: '\u{1F321}\uFE0F' },
  { id: 'hourly', label: '1h forecast', icon: '\u23F1\uFE0F' },
  { id: 'radar', label: 'Radar', icon: '\u{1F4E1}' },
  { id: 'health', label: 'Health & AQI', icon: '\u{1F33F}' },
  { id: 'activities', label: 'Activities', icon: '\u{1F3C3}' },
];

export function BottomTimeline({ hourly, daily: _daily, activeTab, onTabChange }: BottomTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group hourly data by day
  const dayBoundaries: { label: string; startIdx: number }[] = [];
  let prevDay = '';
  hourly.forEach((h, i) => {
    const d = new Date(h.time);
    const dayKey = d.toDateString();
    if (dayKey !== prevDay) {
      const isToday = i === 0 || (new Date().toDateString() === dayKey);
      dayBoundaries.push({
        label: isToday && i < 2
          ? `Today ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        startIdx: i,
      });
      prevDay = dayKey;
    }
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: 'var(--color-surface-solid)',
        borderTop: '1px solid var(--color-border)',
        animation: 'slideUp var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Scrollable forecast data rows */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Day headers row */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', minWidth: 'max-content' }}>
          <RowLabel label="" />
          {hourly.map((_h, i) => {
            const boundary = dayBoundaries.find((b) => b.startIdx === i);
            if (!boundary) return <Cell key={i} width={44} />;
            // Find next boundary to calculate span
            const nextBoundaryIdx = dayBoundaries.findIndex((b) => b.startIdx > i);
            const span = nextBoundaryIdx >= 0
              ? dayBoundaries[nextBoundaryIdx]!.startIdx - i
              : hourly.length - i;
            return (
              <div
                key={i}
                style={{
                  width: span * 44,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  padding: '4px 8px',
                  borderLeft: i > 0 ? '1px dashed var(--color-border)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {boundary.label}
              </div>
            );
          })}
        </div>

        {/* Hours row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="Hours" />
          {hourly.map((h, i) => {
            const time = new Date(h.time);
            const hr = time.getHours();
            const label = hr === 0 ? '12AM' : hr === 12 ? '12PM' : hr < 12 ? `${hr}AM` : `${hr - 12}PM`;
            return (
              <Cell key={i} width={44}>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFeatureSettings: "'tnum' on" }}>
                  {label}
                </span>
              </Cell>
            );
          })}
        </div>

        {/* Weather icons row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="" />
          {hourly.map((h, i) => (
            <Cell key={i} width={44}>
              <span style={{ fontSize: '0.9rem' }}>{getEmoji(h.condition, new Date(h.time).getHours())}</span>
            </Cell>
          ))}
        </div>

        {/* Temperature row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="Temperature" icon="°F" />
          {hourly.map((h, i) => (
            <Cell key={i} width={44} bg={tempCellColor(h.temp)}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                fontFeatureSettings: "'tnum' on",
                color: 'var(--color-text)',
              }}>
                {roundTemp(h.temp)}°
              </span>
            </Cell>
          ))}
        </div>

        {/* Precip probability visual bar row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="Rain %" />
          {hourly.map((h, i) => (
            <Cell key={i} width={44}>
              <div style={{ width: '100%', height: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
                {h.precipProb > 0 && (
                  <div style={{
                    width: '60%',
                    height: `${Math.max(2, (h.precipProb / 100) * 18)}px`,
                    background: h.precipProb >= 70 ? '#3B82F6' : h.precipProb >= 40 ? '#60A5FA' : '#93C5FD',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.8,
                  }} />
                )}
                {h.precipProb > 15 && (
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    fontSize: '0.5rem',
                    color: '#60A5FA',
                    fontWeight: 600,
                    fontFeatureSettings: "'tnum' on",
                  }}>
                    {h.precipProb}
                  </span>
                )}
              </div>
            </Cell>
          ))}
        </div>

        {/* Rain amount row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="Rain" icon="in" />
          {hourly.map((h, i) => (
            <Cell key={i} width={44}>
              {h.precipAmount > 0 ? (
                <span style={{ fontSize: '0.55rem', color: '#60A5FA', fontFeatureSettings: "'tnum' on" }}>
                  {h.precipAmount.toFixed(2)}
                </span>
              ) : null}
            </Cell>
          ))}
        </div>

        {/* Wind row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="Wind" icon="mph" />
          {hourly.map((h, i) => (
            <Cell key={i} width={44}>
              <span style={{
                fontSize: '0.6rem',
                fontFeatureSettings: "'tnum' on",
                color: h.windSpeed >= 20 ? SEVERITY_COLORS.orange : h.windSpeed >= 10 ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: h.windSpeed >= 15 ? 600 : 400,
              }}>
                {Math.round(h.windSpeed)}
              </span>
            </Cell>
          ))}
        </div>

        {/* Wind gusts row */}
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <RowLabel label="Gusts" icon="mph" />
          {hourly.map((h, i) => (
            <Cell key={i} width={44}>
              {h.windGust && (
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontFeatureSettings: "'tnum' on" }}>
                  {Math.round(h.windGust)}
                </span>
              )}
            </Cell>
          ))}
        </div>
      </div>

      {/* Tab bar at very bottom */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: '4px var(--space-3)',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(10, 14, 23, 0.95)',
          overflow: 'hidden',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
              fontSize: '0.7rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              transition: 'all var(--duration-fast)',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Model selector */}
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontWeight: 600 }}>
            ECMWF
          </span>
          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)' }}>
            GFS
          </span>
          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)' }}>
            HRRR
          </span>
        </div>

        {/* Legend scale */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          marginLeft: 'var(--space-3)',
          fontSize: '0.55rem',
          fontFeatureSettings: "'tnum' on",
          color: 'var(--color-text-muted)',
        }}>
          {['0', '5', '10', '20', '30', '40', '60'].map((val, i) => (
            <span key={i} style={{
              padding: '1px 3px',
              borderRadius: '1px',
              background: [
                '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'
              ][i],
              color: i >= 4 ? 'white' : '#1e3a8a',
            }}>
              {val}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function RowLabel({ label, icon }: { label: string; icon?: string }) {
  return (
    <div style={{
      width: '85px',
      minWidth: '85px',
      padding: '2px 8px',
      fontSize: '0.6rem',
      color: 'var(--color-text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      borderRight: '1px solid var(--color-border)',
      background: 'var(--color-surface-solid)',
      position: 'sticky',
      left: 0,
      zIndex: 2,
    }}>
      <span>{label}</span>
      {icon && <span style={{ opacity: 0.5 }}>{icon}</span>}
    </div>
  );
}

function Cell({ children, width = 44, bg }: { children?: React.ReactNode; width?: number; bg?: string }) {
  return (
    <div style={{
      width,
      minWidth: width,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3px 2px',
      background: bg || 'transparent',
      borderRight: '1px solid rgba(148, 163, 184, 0.05)',
    }}>
      {children}
    </div>
  );
}

function tempCellColor(temp: number): string {
  if (temp >= 95) return 'rgba(239, 68, 68, 0.2)';
  if (temp >= 85) return 'rgba(249, 115, 22, 0.15)';
  if (temp >= 75) return 'rgba(234, 179, 8, 0.12)';
  if (temp >= 65) return 'rgba(34, 197, 94, 0.1)';
  if (temp >= 50) return 'rgba(59, 130, 246, 0.08)';
  if (temp >= 35) return 'rgba(99, 102, 241, 0.1)';
  return 'rgba(139, 92, 246, 0.12)';
}

function getEmoji(condition: string, hour: number): string {
  const night = hour < 6 || hour >= 20;
  switch (condition) {
    case 'clear': return night ? '\u{1F319}' : '\u2600\uFE0F';
    case 'partly_cloudy': return night ? '\u{1F319}' : '\u26C5';
    case 'mostly_cloudy': case 'overcast': return '\u2601\uFE0F';
    case 'light_rain': case 'drizzle': return '\u{1F326}\uFE0F';
    case 'rain': case 'heavy_rain': return '\u{1F327}\uFE0F';
    case 'thunderstorm': case 'severe_thunderstorm': return '\u26C8\uFE0F';
    case 'snow': case 'light_snow': case 'heavy_snow': return '\u{1F328}\uFE0F';
    case 'fog': return '\u{1F32B}\uFE0F';
    default: return '\u2601\uFE0F';
  }
}
