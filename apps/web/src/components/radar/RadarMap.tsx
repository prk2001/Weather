import { useState, useRef, useEffect } from 'react';

interface RadarMapProps {
  lat: number;
  lon: number;
}

type RadarLayer = 'reflectivity' | 'velocity' | 'satellite' | 'temperature';

const LAYERS: { id: RadarLayer; label: string; icon: string }[] = [
  { id: 'reflectivity', label: 'Radar', icon: '\u{1F4E1}' },
  { id: 'satellite', label: 'Satellite', icon: '\u{1F6F0}\uFE0F' },
  { id: 'temperature', label: 'Temp Map', icon: '\u{1F321}\uFE0F' },
];

/**
 * Radar Map — placeholder with tile overlay simulation
 * Phase 1: Static map with simulated radar overlay
 * Phase 2 (future): MapLibre GL with real NEXRAD tiles
 */
export function RadarMap({ lat, lon }: RadarMapProps) {
  const [activeLayer, setActiveLayer] = useState<RadarLayer>('reflectivity');
  const [isPlaying, setIsPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalFrames = 20;

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setFrame((prev) => (prev + 1) % totalFrames);
      }, 200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: isExpanded ? '100vw' : '480px',
        boxShadow: 'var(--shadow-lg)',
        position: isExpanded ? 'fixed' : 'relative',
        inset: isExpanded ? 0 : undefined,
        zIndex: isExpanded ? 50 : undefined,
        transition: 'all var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
        }}
      >
        <h2
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Radar & Maps
        </h2>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {/* Layer selector */}
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              title={layer.label}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: activeLayer === layer.id
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                background: activeLayer === layer.id ? 'var(--color-surface-elevated)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {layer.icon}
            </button>
          ))}

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isExpanded ? '\u2716' : '\u26F6'}
          </button>
        </div>
      </div>

      {/* Map area */}
      <div
        style={{
          position: 'relative',
          height: isExpanded ? 'calc(100vh - 100px)' : '280px',
          background: '#1a2a3a',
          overflow: 'hidden',
        }}
      >
        {/* Simulated map grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Simulated radar overlay */}
        {activeLayer === 'reflectivity' && (
          <RadarOverlay frame={frame} lat={lat} lon={lon} />
        )}

        {activeLayer === 'satellite' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 60% 40%, rgba(200,200,200,0.3) 0%, rgba(100,100,120,0.2) 40%, transparent 70%)',
            }}
          />
        )}

        {activeLayer === 'temperature' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.3) 40%, rgba(139,92,246,0.2) 80%)',
            }}
          />
        )}

        {/* Center marker */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
            border: '2px solid white',
            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
            zIndex: 5,
          }}
        />

        {/* Coordinates label */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-2)',
            left: 'var(--space-2)',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            fontFeatureSettings: "'tnum' on",
          }}
        >
          {lat.toFixed(4)}, {lon.toFixed(4)}
        </div>
      </div>

      {/* Playback controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isPlaying ? '\u23F8' : '\u25B6\uFE0F'}
        </button>

        {/* Timeline scrubber */}
        <div
          style={{
            flex: 1,
            height: '4px',
            background: 'var(--color-border)',
            borderRadius: 'var(--radius-full)',
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setFrame(Math.round(pct * (totalFrames - 1)));
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${(frame / (totalFrames - 1)) * 100}%`,
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-full)',
              transition: isPlaying ? 'none' : 'width var(--duration-fast) var(--ease-out)',
            }}
          />
        </div>

        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            fontFamily: 'monospace',
            minWidth: '60px',
            textAlign: 'right',
          }}
        >
          -{totalFrames - frame} min
        </span>
      </div>
    </div>
  );
}

function RadarOverlay({ frame, lat: _lat, lon: _lon }: { frame: number; lat: number; lon: number }) {
  // Simulated radar echoes — blobs that drift with animation frames
  const blobs = [
    { x: 30 + frame * 1.5, y: 25, size: 80, intensity: 0.4 },
    { x: 55 + frame * 0.8, y: 60, size: 50, intensity: 0.6 },
    { x: 15 + frame * 2, y: 70, size: 35, intensity: 0.3 },
    { x: 70 + frame * 0.5, y: 35, size: 60, intensity: 0.5 },
  ];

  return (
    <>
      {blobs.map((blob, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${blob.x % 100}%`,
            top: `${blob.y}%`,
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            borderRadius: '50%',
            background: radarColor(blob.intensity),
            filter: 'blur(15px)',
            opacity: blob.intensity,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.2s linear',
          }}
        />
      ))}
    </>
  );
}

function radarColor(intensity: number): string {
  if (intensity >= 0.7) return '#EF4444'; // Heavy
  if (intensity >= 0.5) return '#F97316'; // Moderate
  if (intensity >= 0.3) return '#22C55E'; // Light
  return '#3B82F6'; // Trace
}
