import type { CurrentConditions } from '@aether/shared';
import { SEVERITY_COLORS } from '@aether/shared';

interface HealthPanelProps {
  conditions: CurrentConditions;
  pressureChangeRate?: number; // mb change in last 6 hours
}

export function HealthPanel({ conditions, pressureChangeRate }: HealthPanelProps) {
  const migraineRisk = calculateMigraineRisk(conditions.pressure, pressureChangeRate);
  const arthritisIndex = calculateArthritisIndex(conditions.humidity, conditions.pressure, conditions.temp);
  const heatStress = calculateHeatStress(conditions.temp, conditions.humidity);
  const coldStress = calculateColdStress(conditions.temp, conditions.windSpeed);

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
        Health & Comfort
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Migraine Risk */}
        <HealthIndicator
          icon="🧠"
          label="Migraine Risk"
          level={migraineRisk.level}
          detail={migraineRisk.detail}
          color={riskColor(migraineRisk.level)}
        />

        {/* Arthritis Index */}
        <HealthIndicator
          icon="🦴"
          label="Joint Comfort"
          level={arthritisIndex.level}
          detail={arthritisIndex.detail}
          color={riskColor(arthritisIndex.level)}
        />

        {/* Heat Stress (if applicable) */}
        {heatStress && (
          <HealthIndicator
            icon="🌡️"
            label="Heat Stress"
            level={heatStress.level}
            detail={heatStress.detail}
            color={riskColor(heatStress.level)}
          />
        )}

        {/* Cold Stress (if applicable) */}
        {coldStress && (
          <HealthIndicator
            icon="❄️"
            label="Cold Stress"
            level={coldStress.level}
            detail={coldStress.detail}
            color={riskColor(coldStress.level)}
          />
        )}

        {/* AQI (if available) */}
        {conditions.aqi && (
          <HealthIndicator
            icon="🌬️"
            label="Air Quality"
            level={aqiToLevel(conditions.aqi.aqi)}
            detail={`AQI ${conditions.aqi.aqi} — ${conditions.aqi.category.replace('_', ' ')}`}
            color={riskColor(aqiToLevel(conditions.aqi.aqi))}
          />
        )}

        {/* Dewpoint Comfort */}
        <HealthIndicator
          icon="💧"
          label="Humidity Comfort"
          level={dewpointLevel(conditions.dewpoint)}
          detail={`Dewpoint ${conditions.dewpoint}\u00B0F — ${dewpointLabel(conditions.dewpoint)}`}
          color={riskColor(dewpointLevel(conditions.dewpoint))}
        />
      </div>
    </div>
  );
}

function HealthIndicator({
  icon,
  label,
  level,
  detail,
  color,
}: {
  icon: string;
  label: string;
  level: 'low' | 'moderate' | 'high' | 'extreme';
  detail: string;
  color: string;
}) {
  const width =
    level === 'low' ? 25 : level === 'moderate' ? 50 : level === 'high' ? 75 : 100;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{icon}</span>
          <span style={{ fontWeight: 500 }}>{label}</span>
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color,
            textTransform: 'uppercase',
          }}
        >
          {level}
        </span>
      </div>

      {/* Risk bar */}
      <div
        style={{
          height: '3px',
          background: 'var(--color-border)',
          borderRadius: 'var(--radius-full)',
          marginBottom: '2px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--duration-normal) var(--ease-out)',
          }}
        />
      </div>

      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{detail}</span>
    </div>
  );
}

type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return SEVERITY_COLORS.green;
    case 'moderate': return SEVERITY_COLORS.yellow;
    case 'high': return SEVERITY_COLORS.orange;
    case 'extreme': return SEVERITY_COLORS.red;
  }
}

function calculateMigraineRisk(
  pressure: number,
  changeRate?: number,
): { level: RiskLevel; detail: string } {
  const drop = changeRate ? Math.abs(changeRate) : 0;
  if (drop >= 8) return { level: 'extreme', detail: `Rapid pressure change: ${drop.toFixed(1)}mb/6hr` };
  if (drop >= 6) return { level: 'high', detail: `Significant pressure change: ${drop.toFixed(1)}mb/6hr` };
  if (drop >= 3) return { level: 'moderate', detail: `Moderate pressure change: ${drop.toFixed(1)}mb/6hr` };
  return { level: 'low', detail: `Stable pressure: ${(pressure / 33.8639).toFixed(2)} inHg` };
}

function calculateArthritisIndex(
  humidity: number,
  pressure: number,
  temp: number,
): { level: RiskLevel; detail: string } {
  let score = 0;
  if (humidity > 80) score += 3;
  else if (humidity > 65) score += 1;
  if (pressure < 1000) score += 2;
  if (temp < 40) score += 2;
  else if (temp < 55) score += 1;

  if (score >= 6) return { level: 'extreme', detail: 'High humidity + low pressure + cold' };
  if (score >= 4) return { level: 'high', detail: 'Multiple joint-stress factors present' };
  if (score >= 2) return { level: 'moderate', detail: 'Some conditions may affect joints' };
  return { level: 'low', detail: 'Favorable conditions for joint comfort' };
}

function calculateHeatStress(
  temp: number,
  humidity: number,
): { level: RiskLevel; detail: string } | null {
  if (temp < 80) return null;
  if (temp >= 105 || (temp >= 95 && humidity >= 60)) {
    return { level: 'extreme', detail: 'Dangerous heat. Avoid outdoor exertion.' };
  }
  if (temp >= 95 || (temp >= 88 && humidity >= 65)) {
    return { level: 'high', detail: 'High heat stress. Hydrate frequently.' };
  }
  if (temp >= 85) {
    return { level: 'moderate', detail: 'Moderate heat. Take breaks in shade.' };
  }
  return { level: 'low', detail: 'Warm but manageable. Stay hydrated.' };
}

function calculateColdStress(
  temp: number,
  windSpeed: number,
): { level: RiskLevel; detail: string } | null {
  if (temp > 40) return null;
  // Simplified wind chill
  const wc = temp <= 50 && windSpeed >= 3
    ? 35.74 + 0.6215 * temp - 35.75 * Math.pow(windSpeed, 0.16) + 0.4275 * temp * Math.pow(windSpeed, 0.16)
    : temp;

  if (wc <= -20) return { level: 'extreme', detail: `Wind chill ${Math.round(wc)}\u00B0F. Frostbite in <10 min.` };
  if (wc <= 0) return { level: 'high', detail: `Wind chill ${Math.round(wc)}\u00B0F. Limit exposure.` };
  if (wc <= 20) return { level: 'moderate', detail: `Wind chill ${Math.round(wc)}\u00B0F. Dress warmly.` };
  return { level: 'low', detail: `Cool. Wind chill ${Math.round(wc)}\u00B0F.` };
}

function aqiToLevel(aqi: number): RiskLevel {
  if (aqi <= 50) return 'low';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 200) return 'high';
  return 'extreme';
}

function dewpointLevel(dp: number): RiskLevel {
  if (dp < 55) return 'low';
  if (dp < 65) return 'moderate';
  if (dp < 75) return 'high';
  return 'extreme';
}

function dewpointLabel(dp: number): string {
  if (dp < 55) return 'comfortable';
  if (dp < 60) return 'pleasant';
  if (dp < 65) return 'somewhat humid';
  if (dp < 70) return 'humid';
  if (dp < 75) return 'oppressive';
  return 'miserable';
}
