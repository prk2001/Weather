import type { WeatherAlert } from '@aether/shared';
import { SeasonalMode } from '@aether/shared';

interface SeasonalBannerProps {
  mode: SeasonalMode | null;
  alerts: WeatherAlert[];
}

const MODE_CONFIG: Record<SeasonalMode, { icon: string; label: string; color: string; bgColor: string }> = {
  [SeasonalMode.Hurricane]: {
    icon: '\u{1F300}',
    label: 'HURRICANE MODE',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  [SeasonalMode.WinterStorm]: {
    icon: '\u2744\uFE0F',
    label: 'WINTER STORM MODE',
    color: '#60A5FA',
    bgColor: 'rgba(96, 165, 250, 0.15)',
  },
  [SeasonalMode.WildfireSmoke]: {
    icon: '\u{1F525}',
    label: 'WILDFIRE SMOKE MODE',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
  },
  [SeasonalMode.SevereThunderstorm]: {
    icon: '\u26A1',
    label: 'SEVERE STORM MODE',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
};

export function SeasonalBanner({ mode, alerts }: SeasonalBannerProps) {
  if (!mode) return null;

  const config = MODE_CONFIG[mode];
  const activeAlerts = alerts.filter(
    (a) => new Date(a.expires) > new Date(),
  );

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '480px',
        background: config.bgColor,
        border: `1px solid ${config.color}`,
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Mode header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>{config.icon}</span>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: config.color,
            letterSpacing: '0.08em',
          }}
        >
          {config.label}
        </span>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: config.color,
            animation: 'pulse 2s infinite',
            marginLeft: 'auto',
          }}
        />
      </div>

      {/* Active alerts */}
      {activeAlerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                background: 'rgba(0,0,0,0.1)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: config.color,
                  marginBottom: '2px',
                }}
              >
                {alert.headline}
              </div>
              {alert.instruction && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {alert.instruction}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          {getModeSummary(mode)}
        </p>
      )}
    </div>
  );
}

function getModeSummary(mode: SeasonalMode): string {
  switch (mode) {
    case SeasonalMode.Hurricane:
      return 'Monitoring tropical activity. Tracking storm development, projected paths, and evacuation route weather.';
    case SeasonalMode.WinterStorm:
      return 'Winter weather awareness. Monitoring snow bands, precipitation type lines, road temperatures, and power outage risk.';
    case SeasonalMode.WildfireSmoke:
      return 'Air quality monitoring active. Tracking smoke plumes, AQI forecasts, and clear air windows.';
    case SeasonalMode.SevereThunderstorm:
      return 'Severe weather outlook active. Monitoring SPC data, supercell parameters, and tornado probability.';
  }
}

/**
 * Auto-detect which seasonal mode should be active based on conditions
 */
export function detectSeasonalMode(
  alerts: WeatherAlert[],
  _lat: number,
  _month: number,
): SeasonalMode | null {
  // Check for active severe alerts
  for (const alert of alerts) {
    const type = alert.type.toLowerCase();
    if (type.includes('hurricane') || type.includes('tropical')) {
      return SeasonalMode.Hurricane;
    }
    if (type.includes('winter storm') || type.includes('blizzard') || type.includes('ice storm')) {
      return SeasonalMode.WinterStorm;
    }
    if (type.includes('fire') || type.includes('smoke') || type.includes('air quality')) {
      return SeasonalMode.WildfireSmoke;
    }
    if (type.includes('tornado') || type.includes('severe thunderstorm')) {
      return SeasonalMode.SevereThunderstorm;
    }
  }

  return null;
}
