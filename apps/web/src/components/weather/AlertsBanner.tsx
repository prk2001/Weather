import type { WeatherAlert } from '@aether/shared';
import { AlertSeverity, AlertUrgency, AlertCertainty } from '@aether/shared';
import { useState } from 'react';

interface AlertsBannerProps {
  alerts: WeatherAlert[];
  onDismiss: () => void;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  extreme: { bg: 'rgba(127, 29, 29, 0.9)', border: '#EF4444', icon: '🚨' },
  severe: { bg: 'rgba(153, 27, 27, 0.85)', border: '#EF4444', icon: '⚠️' },
  moderate: { bg: 'rgba(120, 53, 15, 0.85)', border: '#F97316', icon: '⚠️' },
  minor: { bg: 'rgba(113, 63, 18, 0.8)', border: '#EAB308', icon: 'ℹ️' },
};

/**
 * Weather alerts banner — slides in at top of map when active alerts exist.
 * Pulsing border for extreme/severe, expandable for details.
 */
export function AlertsBanner({ alerts, onDismiss }: AlertsBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) return null;

  // Show the highest severity alert
  const primary = alerts[0]!;
  const style = SEVERITY_STYLES[primary.severity] || SEVERITY_STYLES.minor!;
  const isUrgent = primary.severity === 'extreme' || primary.severity === 'severe';

  return (
    <div
      style={{
        position: 'absolute',
        top: '52px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        width: 'min(600px, calc(100vw - 32px))',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Main alert bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: style.bg,
          backdropFilter: 'var(--blur-panel)',
          border: `1.5px solid ${style.border}`,
          borderRadius: expanded ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
          padding: 'var(--space-3) var(--space-4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          boxShadow: isUrgent ? `0 0 20px ${style.border}44` : 'var(--shadow-lg)',
          animation: isUrgent ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
            {primary.headline}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>
            Until {new Date(primary.expires).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
            {alerts.length > 1 && ` · +${alerts.length - 1} more`}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1rem',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            background: style.bg,
            backdropFilter: 'var(--blur-panel)',
            borderLeft: `1.5px solid ${style.border}`,
            borderRight: `1.5px solid ${style.border}`,
            borderBottom: `1.5px solid ${style.border}`,
            borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
            padding: 'var(--space-4)',
            maxHeight: '200px',
            overflow: 'auto',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginBottom: 'var(--space-3)' }}>
            {primary.description}
          </p>
          {primary.instruction && (
            <div style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: '#fff',
              fontWeight: 600,
            }}>
              📋 {primary.instruction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Generate mock alerts for development/demo
 */
export function generateMockAlerts(lat: number): WeatherAlert[] {
  // Only show alerts sometimes based on location
  const seed = Math.floor(lat * 100) % 10;
  if (seed > 3) return []; // 60% chance of no alerts

  const now = new Date();
  const expires = new Date(now.getTime() + 6 * 3600000);

  if (seed <= 1) {
    return [{
      id: 'mock-1',
      type: 'Severe Thunderstorm Warning',
      severity: AlertSeverity.Severe,
      urgency: AlertUrgency.Immediate,
      certainty: AlertCertainty.Observed,
      headline: 'Severe Thunderstorm Warning until 9:00 PM EDT',
      description: 'The National Weather Service has issued a severe thunderstorm warning for portions of southern Georgia. A severe thunderstorm was located near Valdosta, moving northeast at 35 mph. Hail up to 1.5 inches and wind gusts to 65 mph are expected.',
      instruction: 'Move to an interior room on the lowest floor. Avoid windows. If driving, pull off to the side of the road.',
      affectedZones: ['GAZ158', 'GAZ159'],
      issued: now,
      expires,
      source: 'NWS Tallahassee',
    }];
  }

  return [{
    id: 'mock-2',
    type: 'Heat Advisory',
    severity: AlertSeverity.Moderate,
    urgency: AlertUrgency.Expected,
    certainty: AlertCertainty.Likely,
    headline: 'Heat Advisory in effect from noon to 8 PM EDT',
    description: 'Heat index values up to 108°F expected. Hot temperatures and high humidity may cause heat illnesses.',
    instruction: 'Drink plenty of fluids, stay in air-conditioned rooms, and check on relatives and neighbors.',
    affectedZones: ['GAZ158'],
    issued: now,
    expires,
    source: 'NWS Tallahassee',
  }];
}
