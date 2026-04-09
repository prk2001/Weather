import { useState } from 'react';
import type { CurrentConditions, DailyForecast, HourlyForecast } from '@aether/shared';
import { roundTemp, tempFontWeight, degreesToCompass } from '@aether/weather-core';
import { scoreActivity } from '@aether/weather-core';
import { THRESHOLDS } from '@aether/shared';
import { ShareableCard } from './ShareableCard';
import { useWeatherStore } from '../../stores/weather';

interface WeatherOverlayProps {
  conditions: CurrentConditions;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  onDayClick: (index: number) => void;
  onShowForecastFan?: () => void;
  selectedDayIndex: number | null;
}

/**
 * AETHER Weather Overlay — our signature panel.
 * Not just data — actionable intelligence + personality.
 */
export function WeatherOverlay({ conditions, daily, hourly, onDayClick, selectedDayIndex, onShowForecastFan }: WeatherOverlayProps) {
  const [shareActivity, setShareActivity] = useState<{ id: string; icon: string; name: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { locationName } = useWeatherStore();
  const temp = roundTemp(conditions.temp);
  const feelsLike = roundTemp(conditions.feelsLike);
  const showFeelsLike = Math.abs(conditions.temp - conditions.feelsLike) >= THRESHOLDS.feelsLikeDelta;
  const windCompass = degreesToCompass(conditions.windDir);
  const fontWeight = tempFontWeight(conditions.temp);
  const actionLine = generateActionLine(conditions);
  const conditionLabel = formatCondition(conditions.condition);

  // Quick activity scores from current hour
  const topActivities = hourly.length > 0
    ? getTopActivities(hourly[0]!)
    : [];

  // ── Collapsed mini view ──
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '46px',
          left: 'var(--space-4)',
          zIndex: 21,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          cursor: 'pointer',
          border: '1px solid var(--color-border)',
          fontFamily: 'inherit',
          color: 'var(--color-text)',
          animation: 'fadeIn var(--duration-normal) var(--ease-out)',
        }}
      >
        <span style={{ fontSize: '1.5rem', fontWeight, fontFeatureSettings: "'tnum' on" }}>{temp}°</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{conditionLabel}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>▼</span>
      </button>
    );
  }

  // ── Full view ──
  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '60px',
        left: 'var(--space-4)',
        zIndex: 15,
        width: 'min(320px, calc(100vw - 70px))',
        padding: 0,
        overflow: 'hidden',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(true)}
        style={{
          position: 'absolute', top: '6px', right: '6px', zIndex: 2,
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: 'none',
          color: 'var(--color-text-muted)', fontSize: '0.6rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Collapse panel"
      >
        ▲
      </button>

      {/* ── Main temperature + condition ── */}
      <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight, lineHeight: 1, fontFeatureSettings: "'tnum' on", letterSpacing: '-0.02em' }}>
              {temp}°
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '4px', color: 'var(--color-text)' }}>
              {conditionLabel}
            </div>
            {showFeelsLike && (
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Feels like {feelsLike}°
              </div>
            )}
          </div>
          {/* Right stats column */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '4px' }}>
            <StatChip icon="💨" value={`${conditions.windSpeed} ${windCompass}`} />
            <StatChip icon="💧" value={`${conditions.humidity}%`} />
            <StatChip icon="☀️" value={`UV ${conditions.uvIndex}`} highlight={conditions.uvIndex >= 8} />
            <StatChip icon="👁" value={`${conditions.visibility} mi`} />
          </div>
        </div>
      </div>

      {/* ── Action Line — compact ── */}
      <div style={{ padding: '0 var(--space-4) var(--space-2)' }}>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-accent)',
            fontStyle: 'italic',
            lineHeight: 1.3,
            padding: '4px var(--space-3)',
            background: 'rgba(45, 212, 191, 0.08)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '2px solid var(--color-accent)',
          }}
        >
          {actionLine}
        </div>
      </div>

      {/* ── Go/No-Go + Activity Rings — compact single row ── */}
      {topActivities.length > 0 && (
        <div style={{ padding: '0 var(--space-4) var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GoNoGoIndicator activities={topActivities} />
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            {topActivities.slice(0, 4).map((act) => (
              <div key={act.id} onClick={() => setShareActivity({ id: act.id, icon: act.icon, name: ACTIVITY_NAMES[act.id] ?? act.id })} style={{ cursor: 'pointer' }}>
                <ScoreRing icon={act.icon} score={act.score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4-Day Strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {daily.slice(0, 4).map((day, i) => {
          const date = new Date(day.date);
          const isSelected = selectedDayIndex === i;
          const dayLabel = i === 0 ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

          return (
            <button
              key={i}
              onClick={() => onDayClick(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: 'var(--space-2) var(--space-1)',
                background: isSelected ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                border: 'none',
                borderRight: i < 3 ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background var(--duration-fast)',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(45, 212, 191, 0.15)' : 'transparent'; }}
            >
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                {dayLabel}
              </span>
              <span style={{ fontSize: '1rem' }}>
                {getConditionEmoji(day.condition)}
              </span>
              <div style={{ display: 'flex', gap: '3px', fontSize: '0.7rem', fontFeatureSettings: "'tnum' on" }}>
                <span style={{ fontWeight: 700 }}>{roundTemp(day.tempHigh)}°</span>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{roundTemp(day.tempLow)}°</span>
              </div>
              {day.precipProb > 15 && (
                <span style={{ fontSize: '0.55rem', fontWeight: 600, color: precipColor(day.precipProb) }}>
                  {day.precipProb}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Precip probability bar ── */}
      <div style={{ height: '3px', display: 'flex' }}>
        {daily.slice(0, 4).map((day, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: day.precipProb > 50
                ? `rgba(59, 130, 246, ${day.precipProb / 100})`
                : day.precipProb > 20
                  ? `rgba(59, 130, 246, ${day.precipProb / 200})`
                  : 'transparent',
            }}
          />
        ))}
      </div>

      {/* ── Trust Engine Badge — unique to AETHER ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px var(--space-4)',
          background: 'rgba(0,0,0,0.15)',
          fontSize: '0.6rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>ECMWF+HRRR blended</span>
        <button
          onClick={onShowForecastFan}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--color-severity-green)', fontWeight: 600, fontSize: '0.6rem',
            fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px',
          }}
        >
          {'📊'} Confidence: High
        </button>
      </div>

      {/* Shareable activity card modal */}
      {shareActivity && (
        <ShareableCard
          conditions={conditions}
          hourly={hourly}
          activityId={shareActivity.id}
          activityIcon={shareActivity.icon}
          activityName={shareActivity.name}
          locationName={locationName}
          onClose={() => setShareActivity(null)}
        />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

// ── Go / No-Go Indicator ─────────────────────────────────────

function GoNoGoIndicator({ activities }: { activities: { score: number }[] }) {
  const avgScore = activities.reduce((s, a) => s + a.score, 0) / activities.length;
  const status = avgScore >= 75 ? 'GO' : avgScore >= 45 ? 'MAYBE' : 'NO-GO';
  const color = avgScore >= 75 ? 'var(--color-go)' : avgScore >= 45 ? 'var(--color-maybe)' : 'var(--color-nogo)';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 8px',
      borderRadius: 'var(--radius-full)',
      background: `${color}11`,
      border: `1px solid ${color}33`,
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 4px ${color}`,
      }} />
      <span style={{ fontSize: '0.6rem', fontWeight: 700, color, letterSpacing: '0.05em' }}>
        {status}
      </span>
    </div>
  );
}

// ── Circular Score Ring ───────────────────────────────────────

function ScoreRing({ icon, score }: { icon: string; score: number }) {
  const size = 32;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'var(--color-go)' : score >= 50 ? 'var(--color-maybe)' : 'var(--color-nogo)';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span style={{ fontSize: '0.8rem', zIndex: 1 }}>{icon}</span>
    </div>
  );
}

function StatChip({ icon, value, highlight }: { icon: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      fontSize: '0.68rem',
      color: highlight ? 'var(--color-severity-orange)' : 'var(--color-text-secondary)',
      fontFeatureSettings: "'tnum' on",
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      justifyContent: 'flex-end',
    }}>
      <span style={{ fontSize: '0.7rem' }}>{icon}</span>
      <span style={{ fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  );
}

// ── Action Line Engine ───────────────────────────────────────

const ACTIVITY_NAMES: Record<string, string> = {
  running: 'Running', cycling: 'Cycling', hiking: 'Hiking', golf: 'Golf',
  dog_walking: 'Dog Walking', photography: 'Photography', gardening: 'Gardening',
  grilling: 'Grilling', fishing: 'Fishing', stargazing: 'Stargazing',
  surfing: 'Surfing', wedding: 'Outdoor Wedding', snow_sports: 'Snow Sports',
};

function generateActionLine(c: CurrentConditions): string {
  if (c.condition === 'thunderstorm' || c.condition === 'severe_thunderstorm')
    return 'Thunderstorms active. Stay indoors and away from windows.';
  if (c.condition === 'heavy_rain' || c.condition === 'rain')
    return 'Rain falling — grab an umbrella if heading out.';
  if (c.condition === 'snow' || c.condition === 'heavy_snow')
    return 'Snow coming down. Roads may be slick — allow extra time.';
  if (c.temp >= 100)
    return 'Dangerously hot. Limit outdoor exposure and hydrate frequently.';
  if (c.temp >= 90)
    return 'Hot afternoon ahead. Seek shade and stay hydrated.';
  if (c.temp <= 15)
    return 'Bitterly cold. Frostbite risk — cover exposed skin.';
  if (c.temp <= 32)
    return 'Below freezing. Watch for black ice and dress warm.';
  if (c.windSpeed >= 30)
    return 'High winds — secure loose outdoor items.';
  if (c.uvIndex >= 8)
    return 'UV very high. Sunscreen and shade strongly recommended.';
  if (c.temp >= 65 && c.temp <= 80 && c.condition === 'clear')
    return 'Perfect conditions. The sky is yours — get outside.';
  if (c.temp >= 55 && c.temp <= 75 && c.windSpeed < 15)
    return 'Great window for outdoor activities. Enjoy it.';
  if (c.condition === 'fog')
    return 'Foggy conditions. Reduce speed and use low beams.';
  if (c.humidity >= 80 && c.temp >= 75)
    return 'Muggy out there. Take it easy and drink water.';
  return 'Decent conditions ahead. Check the hourly for your best window.';
}

// ── Activity Quick Scores ────────────────────────────────────

const QUICK_ACTIVITIES = [
  { id: 'running', icon: '🏃' },
  { id: 'cycling', icon: '🚴' },
  { id: 'hiking', icon: '🥾' },
  { id: 'golf', icon: '⛳' },
  { id: 'dog_walking', icon: '🐕' },
  { id: 'photography', icon: '📷' },
];

function getTopActivities(hour: HourlyForecast) {
  return QUICK_ACTIVITIES.map((a) => ({
    ...a,
    score: scoreActivity(a.id, hour).score,
  })).sort((a, b) => b.score - a.score).slice(0, 5);
}

function precipColor(prob: number): string {
  if (prob >= 70) return '#F97316';
  if (prob >= 40) return '#EAB308';
  return '#60A5FA';
}

// ── Condition formatting ─────────────────────────────────────

function formatCondition(condition: string): string {
  return condition.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getConditionEmoji(condition: string): string {
  switch (condition) {
    case 'clear': return '☀️';
    case 'partly_cloudy': return '⛅';
    case 'mostly_cloudy': case 'overcast': return '☁️';
    case 'light_rain': case 'drizzle': return '🌦️';
    case 'rain': case 'heavy_rain': return '🌧️';
    case 'thunderstorm': case 'severe_thunderstorm': return '⛈️';
    case 'snow': case 'light_snow': case 'heavy_snow': return '🌨️';
    case 'fog': return '🌫️';
    default: return '☁️';
  }
}
