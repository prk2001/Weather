import type { CurrentConditions, HourlyForecast } from '@aether/shared';
import { roundTemp, degreesToCompass } from '@aether/weather-core';
import { scoreActivity, findBestWindows } from '@aether/weather-core';

interface ShareableCardProps {
  conditions: CurrentConditions;
  hourly: HourlyForecast[];
  activityId: string;
  activityIcon: string;
  activityName: string;
  locationName: string;
  onClose: () => void;
}

/**
 * Beautiful shareable card — screenshot-ready for social media.
 * Shows activity score, conditions breakdown, best window, and AETHER branding.
 */
export function ShareableCard({
  conditions,
  hourly,
  activityId,
  activityIcon,
  activityName,
  locationName,
  onClose,
}: ShareableCardProps) {
  const score = hourly.length > 0 ? scoreActivity(activityId, hourly[0]!) : null;
  const bestWindows = hourly.length > 0 ? findBestWindows(activityId, hourly, 2, 1) : [];
  const bestWindow = bestWindows[0];
  const goStatus = score ? (score.score >= 75 ? 'GO' : score.score >= 45 ? 'MAYBE' : 'NO-GO') : 'N/A';
  const goColor = score ? (score.score >= 75 ? '#34d399' : score.score >= 45 ? '#fbbf24' : '#f87171') : '#546378';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {/* The shareable card */}
        <div
          id="aether-share-card"
          style={{
            width: '380px',
            background: 'linear-gradient(160deg, #0b1117 0%, #0e1c28 40%, #0f2318 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(45, 212, 191, 0.15)',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(45,212,191,0.05)',
            color: '#e8edf4',
            fontFamily: "'Inter', system-ui, sans-serif",
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient orb in background */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${goColor}15, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Header — location + date */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.7rem', color: '#546378', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              {dateStr}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
              {locationName}
            </div>
          </div>

          {/* Activity hero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            {/* Big score ring */}
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={goColor}
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - (score?.score ?? 0) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.8rem' }}>{activityIcon}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {activityName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  background: `${goColor}18`,
                  border: `1px solid ${goColor}40`,
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: goColor }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: goColor }}>
                    {goStatus}
                  </span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFeatureSettings: "'tnum' on" }}>
                  {score?.score ?? 0}/100
                </span>
              </div>
            </div>
          </div>

          {/* Condition factors */}
          {score && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {score.factors.slice(0, 4).map((factor, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                }}>
                  <span style={{ color: '#8a9bb0' }}>
                    {factor.impact === 'positive' ? '✅' : factor.impact === 'dealbreaker' ? '❌' : factor.impact === 'negative' ? '⚠️' : '➖'}{' '}
                    {factor.name}
                  </span>
                  <span style={{ fontWeight: 600, fontFeatureSettings: "'tnum' on" }}>
                    {factor.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Best window */}
          {bestWindow?.window && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(45, 212, 191, 0.06)',
              border: '1px solid rgba(45, 212, 191, 0.12)',
              borderRadius: '12px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#546378', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Best Window Today
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {new Date(bestWindow.window.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' — '}
                {new Date(bestWindow.window.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                <span style={{ color: goColor, marginLeft: '8px', fontSize: '0.8rem' }}>
                  Score: {bestWindow.score}
                </span>
              </div>
            </div>
          )}

          {/* Current conditions summary */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.75rem',
            color: '#8a9bb0',
          }}>
            <span>{roundTemp(conditions.temp)}°F</span>
            <span>{degreesToCompass(conditions.windDir)} {conditions.windSpeed} mph</span>
            <span>{conditions.humidity}% humidity</span>
          </div>

          {/* AETHER branding footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.5rem',
              }}>
                {'☁'}
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                background: 'linear-gradient(135deg, #5eead4, #2dd4bf)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                AETHER
              </span>
            </div>
            <span style={{ fontSize: '0.55rem', color: '#546378' }}>
              Atmospheric Intelligence
            </span>
          </div>
        </div>

        {/* Action buttons below card */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-4)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              // Copy share text to clipboard
              const text = `${activityIcon} ${activityName}: ${score?.score ?? 0}/100 ${goStatus}\n${locationName} | ${roundTemp(conditions.temp)}°F\n\nvia AETHER — aether.weather`;
              navigator.clipboard?.writeText(text);
            }}
            style={{
              padding: '8px 20px',
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: '#0b1117',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Copy to Share
          </button>
        </div>
      </div>
    </div>
  );
}
