import type { MapLayer } from '../../App';
import type { MapControls } from '../map/MapBackground';

interface LayerSidebarProps {
  activeLayer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  mapControls?: MapControls | null;
}

const LAYERS: { id: MapLayer; label: string; icon: string }[] = [
  { id: 'radar', label: 'Radar', icon: '\u{1F4E1}' },
  { id: 'satellite', label: 'Satellite', icon: '\u{1F6F0}\uFE0F' },
  { id: 'wind', label: 'Wind', icon: '\u{1F4A8}' },
  { id: 'rain', label: 'Precip', icon: '\u{1F4A7}' },
  { id: 'temperature', label: 'Temp', icon: '\u{1F321}\uFE0F' },
  { id: 'clouds', label: 'Clouds', icon: '\u2601\uFE0F' },
];

export function LayerSidebar({ activeLayer, onLayerChange, mapControls }: LayerSidebarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 'var(--space-3)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-end',
      }}
    >
      {/* Layer pills — vertical stack */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '4px',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {LAYERS.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              title={layer.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '6px 10px',
                background: isActive ? 'var(--color-accent)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#fff' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.65rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all var(--duration-fast) var(--ease-out)',
                whiteSpace: 'nowrap',
                minWidth: '70px',
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>{layer.icon}</span>
              <span>{layer.label}</span>
            </button>
          );
        })}
      </div>

      {/* Zoom controls — compact */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        {[
          { label: '+', action: () => mapControls?.zoomIn(), title: 'Zoom in' },
          { label: '\u2212', action: () => mapControls?.zoomOut(), title: 'Zoom out' },
          { label: '\u25CE', action: () => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => mapControls?.flyTo(pos.coords.latitude, pos.coords.longitude, 7),
              () => {},
              { enableHighAccuracy: false, timeout: 10000 },
            );
          }, title: 'My location' },
        ].map(({ label, action, title }, i) => (
          <button
            key={i}
            onClick={action}
            title={title}
            style={{
              width: '30px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              transition: 'background var(--duration-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
