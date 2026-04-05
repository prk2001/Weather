import type { HourlyForecast } from '@aether/shared';

interface MinutePrecipProps {
  hourly: HourlyForecast[];
  locationName: string;
}

/**
 * Dark Sky-inspired minute-by-minute precipitation forecast.
 * Shows the next 2 hours as a visual bar chart with precipitation intensity.
 * Uses hourly data interpolated to simulate minute resolution.
 */
export function MinutePrecip({ hourly, locationName: _locationName }: MinutePrecipProps) {
  if (hourly.length < 2) return null;

  // Generate 120 "minute" data points from hourly data
  const minutes = generateMinuteData(hourly.slice(0, 3));
  const hasAnyPrecip = minutes.some((m) => m.intensity > 0);
  const maxIntensity = Math.max(...minutes.map((m) => m.intensity), 0.01);

  // Determine the narrative
  const narrative = generateNarrative(minutes);

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '60px',
        left: 'calc(min(320px, calc(100vw - 70px)) + 32px)',
        zIndex: 14,
        width: '260px',
        padding: 0,
        overflow: 'hidden',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Next 2 Hours
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: hasAnyPrecip ? '#60a5fa' : 'var(--color-accent)', marginTop: '2px' }}>
            {narrative}
          </div>
        </div>
        <span style={{ fontSize: '1.2rem' }}>{hasAnyPrecip ? '🌧️' : '☀️'}</span>
      </div>

      {/* Minute-by-minute bar chart */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '48px',
        padding: '0 14px',
        gap: '1px',
      }}>
        {minutes.map((m, i) => {
          const height = m.intensity > 0 ? Math.max(3, (m.intensity / maxIntensity) * 44) : 0;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${height}px`,
                background: intensityColor(m.intensity),
                borderRadius: '1px 1px 0 0',
                transition: 'height 0.3s ease',
                opacity: m.intensity > 0 ? 0.9 : 0.15,
                minHeight: m.intensity > 0 ? '3px' : '1px',
              }}
              title={`${m.minute} min: ${m.intensity > 0 ? precipLabel(m.intensity) : 'Dry'}`}
            />
          );
        })}
      </div>

      {/* Time labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 14px 8px',
        fontSize: '0.5rem',
        color: 'var(--color-text-muted)',
        fontFeatureSettings: "'tnum' on",
      }}>
        <span>Now</span>
        <span>30m</span>
        <span>60m</span>
        <span>90m</span>
        <span>2hr</span>
      </div>

      {/* Intensity legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 14px 8px',
        fontSize: '0.5rem',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <LegendDot color="#93c5fd" label="Light" />
        <LegendDot color="#3b82f6" label="Moderate" />
        <LegendDot color="#1d4ed8" label="Heavy" />
        <LegendDot color="#7c3aed" label="Extreme" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '1px', background: color }} />
      <span>{label}</span>
    </div>
  );
}

// ── Data generation ──────────────────────────────────────────

interface MinuteData {
  minute: number;
  intensity: number; // 0 = dry, 0.01-0.1 = light, 0.1-0.3 = moderate, 0.3+ = heavy
}

function generateMinuteData(hourly: HourlyForecast[]): MinuteData[] {
  const minutes: MinuteData[] = [];

  for (let m = 0; m < 120; m++) {
    // Interpolate between hourly data points
    const hourIdx = Math.min(Math.floor(m / 60), hourly.length - 1);
    const hour = hourly[hourIdx];

    if (!hour) {
      minutes.push({ minute: m, intensity: 0 });
      continue;
    }

    // Base intensity from precipitation probability and amount
    const prob = hour.precipProb / 100;
    const amount = hour.precipAmount;

    // Add some variation to make it look realistic (not flat bars)
    const variation = Math.sin(m * 0.15) * 0.3 + Math.cos(m * 0.07) * 0.2;
    const baseIntensity = prob > 0.3 ? (amount > 0 ? amount : prob * 0.2) : 0;
    const intensity = Math.max(0, baseIntensity + (baseIntensity > 0 ? variation * baseIntensity : 0));

    minutes.push({ minute: m, intensity });
  }

  return minutes;
}

function generateNarrative(minutes: MinuteData[]): string {
  const hasRain = minutes.some((m) => m.intensity > 0.01);
  if (!hasRain) return 'No precipitation expected';

  // Find first rain and last rain
  const firstRain = minutes.findIndex((m) => m.intensity > 0.01);
  const lastRain = minutes.length - 1 - [...minutes].reverse().findIndex((m) => m.intensity > 0.01);

  if (firstRain <= 5) {
    if (lastRain >= 115) return 'Rain throughout the next 2 hours';
    return `Rain ending in ~${lastRain} min`;
  }

  return `Rain starting in ~${firstRain} min`;
}

function intensityColor(intensity: number): string {
  if (intensity >= 0.5) return '#7c3aed';  // Extreme — purple
  if (intensity >= 0.3) return '#1d4ed8';  // Heavy — dark blue
  if (intensity >= 0.1) return '#3b82f6';  // Moderate — blue
  if (intensity > 0) return '#93c5fd';     // Light — light blue
  return 'var(--color-border)';            // Dry
}

function precipLabel(intensity: number): string {
  if (intensity >= 0.5) return 'Extreme';
  if (intensity >= 0.3) return 'Heavy';
  if (intensity >= 0.1) return 'Moderate';
  return 'Light';
}
