import type { MapLayer } from '../../App';

interface LayerLegendProps {
  layer: MapLayer;
}

const LEGENDS: Record<MapLayer, { label: string; unit: string; stops: { value: string; color: string }[] } | null> = {
  radar: {
    label: 'Reflectivity',
    unit: 'dBZ',
    stops: [
      { value: '5', color: '#93c5fd' },
      { value: '20', color: '#3b82f6' },
      { value: '35', color: '#22c55e' },
      { value: '45', color: '#eab308' },
      { value: '55', color: '#f97316' },
      { value: '65', color: '#ef4444' },
      { value: '75', color: '#9333ea' },
    ],
  },
  rain: {
    label: 'Precipitation',
    unit: 'in/hr',
    stops: [
      { value: '0', color: '#dbeafe' },
      { value: '.01', color: '#93c5fd' },
      { value: '.1', color: '#3b82f6' },
      { value: '.25', color: '#22c55e' },
      { value: '.5', color: '#eab308' },
      { value: '1', color: '#f97316' },
      { value: '2+', color: '#ef4444' },
    ],
  },
  temperature: {
    label: 'Temperature',
    unit: '°F',
    stops: [
      { value: '<20', color: '#818cf8' },
      { value: '32', color: '#60a5fa' },
      { value: '50', color: '#34d399' },
      { value: '65', color: '#a3e635' },
      { value: '80', color: '#eab308' },
      { value: '95', color: '#f97316' },
      { value: '110+', color: '#dc2626' },
    ],
  },
  wind: {
    label: 'Wind Speed',
    unit: 'mph',
    stops: [
      { value: '0', color: '#6ee7b7' },
      { value: '5', color: '#34d399' },
      { value: '15', color: '#3b82f6' },
      { value: '25', color: '#8b5cf6' },
      { value: '40', color: '#eab308' },
      { value: '60', color: '#f97316' },
      { value: '80+', color: '#dc2626' },
    ],
  },
  clouds: {
    label: 'Cloud Cover',
    unit: '%',
    stops: [
      { value: '0', color: 'rgba(255,255,255,0.05)' },
      { value: '25', color: 'rgba(255,255,255,0.15)' },
      { value: '50', color: 'rgba(255,255,255,0.3)' },
      { value: '75', color: 'rgba(255,255,255,0.5)' },
      { value: '100', color: 'rgba(255,255,255,0.7)' },
    ],
  },
  satellite: null,
};

export function LayerLegend({ layer }: LayerLegendProps) {
  const legend = LEGENDS[layer];
  if (!legend) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '42px',
        right: 'var(--space-3)',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '3px 8px',
        background: 'var(--color-surface)',
        backdropFilter: 'var(--blur-panel)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontSize: '0.5rem',
        color: 'var(--color-text-muted)',
        fontFeatureSettings: "'tnum' on",
      }}
    >
      <span style={{ marginRight: '4px', fontWeight: 600, fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {legend.unit}
      </span>
      {legend.stops.map((stop, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1px',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '6px',
              background: stop.color,
              borderRadius: i === 0 ? '2px 0 0 2px' : i === legend.stops.length - 1 ? '0 2px 2px 0' : '0',
            }}
          />
          <span style={{ fontSize: '0.4rem' }}>{stop.value}</span>
        </div>
      ))}
    </div>
  );
}
