import { useEffect, useState } from 'react';
import type { CurrentConditions } from '@aether/shared';
import { dewpointComfort } from '@aether/weather-core';

interface HealthAqiPanelProps {
  conditions: CurrentConditions;
  lat: number;
  lon: number;
  onClose: () => void;
}

interface AqiData {
  aqi: number;
  category: string;
  pollutant: string;
  color: string;
}

const AQI_COLORS: Record<string, string> = {
  Good: '#34d399',
  Moderate: '#fbbf24',
  'Unhealthy for Sensitive Groups': '#fb923c',
  Unhealthy: '#f87171',
  'Very Unhealthy': '#c084fc',
  Hazardous: '#991b1b',
};

export function HealthAqiPanel({ conditions, lat, lon, onClose }: HealthAqiPanelProps) {
  const [aqi, setAqi] = useState<AqiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch AQI from AirNow (free, no API key for the widget endpoint)
    setLoading(true);
    fetch(`https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&distance=50&API_KEY=DEMO_KEY`)
      .then(r => r.json())
      .then((data: Array<Record<string, unknown>>) => {
        if (data && data.length > 0) {
          const primary = data[0]!;
          setAqi({
            aqi: primary.AQI as number ?? 0,
            category: (primary.Category as Record<string, unknown>)?.Name as string ?? 'Unknown',
            pollutant: primary.ParameterName as string ?? 'PM2.5',
            color: AQI_COLORS[(primary.Category as Record<string, unknown>)?.Name as string] ?? '#34d399',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lat, lon]);

  const dpComfort = dewpointComfort(conditions.dewpoint);
  const heatRisk = conditions.temp >= 95 ? 'High' : conditions.temp >= 85 ? 'Moderate' : 'Low';
  const uvRisk = conditions.uvIndex >= 8 ? 'Very High' : conditions.uvIndex >= 6 ? 'High' : conditions.uvIndex >= 3 ? 'Moderate' : 'Low';

  // Migraine risk based on pressure
  const pressureInHg = conditions.pressure / 33.8639;
  const migraineRisk = pressureInHg < 29.7 ? 'Elevated' : pressureInHg > 30.3 ? 'Elevated' : 'Low';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface-solid)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border)',
          maxWidth: '500px', width: '100%', maxHeight: '85vh', overflow: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{'🌿'} Health & Air Quality</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Health metrics based on current conditions
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* AQI Card */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: `3px solid ${aqi?.color ?? 'var(--color-accent)'}`,
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Air Quality Index
            </div>
            {loading ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading AQI data...</div>
            ) : aqi ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{
                  fontSize: '2.2rem', fontWeight: 800, color: aqi.color,
                  fontFeatureSettings: "'tnum' on",
                }}>
                  {aqi.aqi}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: aqi.color }}>{aqi.category}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Primary: {aqi.pollutant}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                AQI data not available for this location
              </div>
            )}
          </div>

          {/* Health Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <HealthCard
              icon="🌡️"
              label="Heat Risk"
              value={heatRisk}
              detail={`${conditions.temp}°F`}
              color={heatRisk === 'High' ? '#f87171' : heatRisk === 'Moderate' ? '#fbbf24' : '#34d399'}
            />
            <HealthCard
              icon="☀️"
              label="UV Exposure"
              value={uvRisk}
              detail={`UV Index: ${conditions.uvIndex}`}
              color={uvRisk === 'Very High' ? '#f87171' : uvRisk === 'High' ? '#fb923c' : uvRisk === 'Moderate' ? '#fbbf24' : '#34d399'}
            />
            <HealthCard
              icon="💧"
              label="Humidity Comfort"
              value={dpComfort.charAt(0).toUpperCase() + dpComfort.slice(1)}
              detail={`Dewpoint: ${conditions.dewpoint}°F`}
              color={dpComfort === 'miserable' ? '#f87171' : dpComfort === 'oppressive' ? '#fb923c' : dpComfort === 'humid' ? '#fbbf24' : '#34d399'}
            />
            <HealthCard
              icon="🧠"
              label="Migraine Risk"
              value={migraineRisk}
              detail={`Pressure: ${pressureInHg.toFixed(2)} inHg`}
              color={migraineRisk === 'Elevated' ? '#fb923c' : '#34d399'}
            />
            <HealthCard
              icon="👁"
              label="Visibility"
              value={conditions.visibility >= 7 ? 'Good' : conditions.visibility >= 3 ? 'Fair' : 'Poor'}
              detail={`${conditions.visibility} miles`}
              color={conditions.visibility >= 7 ? '#34d399' : conditions.visibility >= 3 ? '#fbbf24' : '#f87171'}
            />
            <HealthCard
              icon="🏃"
              label="Outdoor Exercise"
              value={conditions.temp >= 90 || conditions.temp <= 20 ? 'Caution' : conditions.temp >= 40 && conditions.temp <= 85 ? 'Safe' : 'Monitor'}
              detail={conditions.temp >= 90 ? 'Heat stress risk' : conditions.temp <= 20 ? 'Frostbite risk' : 'Good conditions'}
              color={conditions.temp >= 90 || conditions.temp <= 20 ? '#f87171' : conditions.temp >= 40 && conditions.temp <= 85 ? '#34d399' : '#fbbf24'}
            />
          </div>

          {/* Recommendations */}
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(45, 212, 191, 0.06)',
            border: '1px solid rgba(45, 212, 191, 0.12)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '6px' }}>
              {'💡'} Health Recommendations
            </div>
            <ul style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.5 }}>
              {conditions.uvIndex >= 6 && <li>Apply SPF 30+ sunscreen — UV is {conditions.uvIndex >= 8 ? 'very high' : 'high'}</li>}
              {conditions.temp >= 85 && <li>Stay hydrated — drink water every 20 minutes outdoors</li>}
              {conditions.temp <= 32 && <li>Dress in layers and cover extremities to prevent frostbite</li>}
              {conditions.humidity >= 80 && <li>High humidity — take breaks to cool down</li>}
              {migraineRisk === 'Elevated' && <li>Barometric pressure change may trigger migraines</li>}
              {aqi && aqi.aqi > 100 && <li>Reduce prolonged outdoor exertion — air quality is {aqi.category.toLowerCase()}</li>}
              {conditions.uvIndex < 3 && conditions.temp >= 50 && conditions.temp <= 80 && <li>Great conditions for extended outdoor activity</li>}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.6rem', color: 'var(--color-text-muted)', textAlign: 'center',
        }}>
          AQI: AirNow EPA &middot; Health metrics: NWS observation data
        </div>
      </div>
    </div>
  );
}

function HealthCard({ icon, label, value, detail, color }: {
  icon: string; label: string; value: string; detail: string; color: string;
}) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--color-surface-elevated)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.85rem' }}>{icon}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{detail}</div>
    </div>
  );
}
