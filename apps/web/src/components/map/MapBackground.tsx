import { useEffect, useRef, useState } from 'react';
import type { MapLayer } from '../../App';
import type { WeatherCondition } from '@aether/shared';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapBackgroundProps {
  layer: MapLayer;
  lat: number;
  lon: number;
  windSpeed?: number;
  windDir?: number;
  condition?: WeatherCondition;
  onSpotForecast?: (lat: number, lon: number) => void;
  mapControlsRef?: React.MutableRefObject<MapControls | null>;
}

export interface MapControls {
  zoomIn: () => void;
  zoomOut: () => void;
  flyTo: (lat: number, lon: number, zoom?: number) => void;
}

// ── Tile layer URLs ──────────────────────────────────────────
// ── Free tile sources (no API key required) ─────────────────

// Dark base map + labels
const BASE_MAPS: Record<string, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
  satellite_base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};
const BASE_LABELS = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';

// RainViewer — free real-time radar and satellite IR composites (global, updated every 10 min)
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

export function MapBackground({
  layer,
  lat,
  lon,
  windSpeed = 10,
  windDir = 225,
  condition,
  onSpotForecast,
  mapControlsRef,
}: MapBackgroundProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  const [rainviewerTiles, setRainviewerTiles] = useState<{
    radar: string | null;
    satellite: string | null;
  }>({ radar: null, satellite: null });

  // Fetch RainViewer tile URLs on mount (free, no API key)
  useEffect(() => {
    fetch(RAINVIEWER_API)
      .then((r) => r.json())
      .then((data) => {
        const radarFrames = data?.radar?.past;
        const satFrames = data?.satellite?.infrared;
        const latestRadar = radarFrames?.[radarFrames.length - 1];
        const latestSat = satFrames?.[satFrames.length - 1];
        setRainviewerTiles({
          radar: latestRadar
            ? `https://tilecache.rainviewer.com${latestRadar.path}/256/{z}/{x}/{y}/2/1_1.png`
            : null,
          satellite: latestSat
            ? `https://tilecache.rainviewer.com${latestSat.path}/256/{z}/{x}/{y}/0/0_0.png`
            : null,
        });
      })
      .catch(() => { /* offline fallback — map renders without weather overlay */ });
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 7,
      minZoom: 3,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      keyboard: false,
    });

    // Dark base map — cap at native zoom 15 to avoid "Zoom Level Not Supported" tiles
    L.tileLayer(BASE_MAPS.dark!, {
      subdomains: 'abcd',
      maxNativeZoom: 15,
      maxZoom: 15,
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    }).addTo(map);

    // Labels on top
    L.tileLayer(BASE_LABELS, {
      subdomains: 'abcd',
      maxNativeZoom: 15,
      maxZoom: 15,
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
      pane: 'overlayPane',
    }).addTo(map);

    // Location marker
    const markerIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: #2dd4bf; border: 2px solid white;
        box-shadow: 0 0 12px rgba(45,212,191,0.6), 0 2px 6px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([lat, lon], { icon: markerIcon }).addTo(map);

    // Click on map → spot forecast at that location
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onSpotForecast) {
        onSpotForecast(
          Math.round(e.latlng.lat * 10000) / 10000,
          Math.round(e.latlng.lng * 10000) / 10000,
        );
      }
    });

    // Pan/zoom the map → auto-update weather for new center (debounced)
    // Pan/zoom → auto-update weather (debounced, US-only)
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    map.on('moveend', () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        const center = map.getCenter();
        // Only fetch if within approximate US/territories bounds
        // NWS API only covers US — skip ocean/foreign locations
        const inUS = center.lat >= 24 && center.lat <= 50
          && center.lng >= -125 && center.lng <= -66;
        if (onSpotForecast && inUS) {
          onSpotForecast(
            Math.round(center.lat * 10000) / 10000,
            Math.round(center.lng * 10000) / 10000,
          );
        }
      }, 3000);
    });

    leafletMap.current = map;

    // Expose controls
    if (mapControlsRef) {
      mapControlsRef.current = {
        zoomIn: () => map.zoomIn(),
        zoomOut: () => map.zoomOut(),
        flyTo: (flyLat, flyLon, zoom = 8) => map.flyTo([flyLat, flyLon], zoom),
      };
    }

    return () => {
      map.remove();
      leafletMap.current = null;
      if (mapControlsRef) mapControlsRef.current = null;
    };
  }, []);

  // Update map center when location changes
  useEffect(() => {
    leafletMap.current?.setView([lat, lon], 7, { animate: true });
  }, [lat, lon]);

  // Switch weather overlay layer
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Remove all previous overlays
    const prevOverlays = (map as unknown as Record<string, L.TileLayer[]>)._aetherOverlays ?? [];
    for (const ol of prevOverlays) {
      map.removeLayer(ol);
    }
    overlayRef.current = null;

    // Each layer can have multiple tile overlays stacked
    const overlays: { url: string; opacity: number }[] = [];

    switch (layer) {
      case 'radar':
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.75 });
        break;
      case 'rain':
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.85 });
        break;
      case 'satellite':
        // ESRI satellite imagery + RainViewer radar on top to show precip
        overlays.push({ url: BASE_MAPS.satellite_base!, opacity: 0.65 });
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.5 });
        if (rainviewerTiles.satellite) overlays.push({ url: rainviewerTiles.satellite, opacity: 0.35 });
        break;
      case 'clouds':
        // RainViewer satellite IR at high opacity so clouds are clearly visible
        if (rainviewerTiles.satellite) overlays.push({ url: rainviewerTiles.satellite, opacity: 0.85 });
        break;
      case 'temperature':
        // Show radar for precipitation context on temp view
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.4 });
        break;
      case 'wind':
        // Faint radar underneath the wind particles
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.25 });
        break;
    }

    // Add all overlay layers
    const layers: L.TileLayer[] = [];
    for (const ov of overlays) {
      const isRV = ov.url.includes('rainviewer');
      const tl = L.tileLayer(ov.url, {
        opacity: ov.opacity,
        maxNativeZoom: isRV ? 12 : 15,
        maxZoom: 15,
        errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
      });
      tl.addTo(map);
      layers.push(tl);
    }
    // Store first layer ref for cleanup (we'll clean all on next switch)
    if (layers[0]) overlayRef.current = layers[0];
    // Store extras for cleanup
    (map as unknown as Record<string, L.TileLayer[]>)._aetherOverlays = layers;
  }, [layer, rainviewerTiles]);

  // Weather effects overlay
  const isRaining =
    condition === 'rain' ||
    condition === 'heavy_rain' ||
    condition === 'light_rain' ||
    condition === 'drizzle';
  const isSnowing =
    condition === 'snow' ||
    condition === 'heavy_snow' ||
    condition === 'light_snow';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {/* Leaflet map container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0e17',
        }}
      />

      {/* Wind direction particles (wind layer only) */}
      {layer === 'wind' && (
        <WindDirectionOverlay windSpeed={windSpeed} windDir={windDir} />
      )}

      {/* Wind compass rose — always visible */}
      <WindCompass windSpeed={windSpeed} windDir={windDir} />

      {/* Temperature heatmap overlay — latitude-based warm/cool gradient */}
      {layer === 'temperature' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(34,197,94,0.2) 25%, rgba(234,179,8,0.2) 45%, rgba(249,115,22,0.25) 65%, rgba(239,68,68,0.25) 85%, rgba(153,27,27,0.3) 100%)',
          mixBlendMode: 'screen',
        }} />
      )}

      {/* Precipitation animation overlay */}
      {isRaining && <RainOverlay intensity={condition === 'heavy_rain' ? 3 : 1} />}
      {isSnowing && <SnowOverlay />}

      {/* Subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Override leaflet default styles for dark theme */}
      <style>{`
        .leaflet-container { background: #0a0e17 !important; }
        .leaflet-tile-pane { filter: saturate(1.2) brightness(0.95); }
        .leaflet-control-attribution { display: none !important; }
      `}</style>
    </div>
  );
}

// ── Wind Direction Overlay ───────────────────────────────────
// Shows animated arrows flowing in the actual wind direction

function WindDirectionOverlay({
  windSpeed,
  windDir,
}: {
  windSpeed: number;
  windDir: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Wind direction in radians (meteorological: direction wind comes FROM)
    // Convert to direction wind flows TOWARD for animation
    const flowAngle = ((windDir + 180) % 360) * (Math.PI / 180);

    // Create particles
    const count = Math.min(200, Math.max(40, Math.floor(windSpeed * 8)));
    const particles: {
      x: number;
      y: number;
      age: number;
      maxAge: number;
      speed: number;
      opacity: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      particles.push(createWindParticle(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Minimum speed of 1 so particles always move visibly even at 0 mph
      const baseSpeed = Math.max(1, windSpeed * 0.3);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        // Move in wind direction
        const dx = Math.cos(flowAngle) * baseSpeed * p.speed;
        const dy = Math.sin(flowAngle) * baseSpeed * p.speed;

        const prevX = p.x;
        const prevY = p.y;

        p.x += dx;
        p.y += dy;
        p.age++;

        // Draw trail
        const lifePct = p.age / p.maxAge;
        const fade =
          lifePct < 0.15
            ? lifePct / 0.15
            : lifePct > 0.7
              ? (1 - lifePct) / 0.3
              : 1;
        const alpha = fade * p.opacity * 0.7;

        if (alpha > 0.02) {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw small arrowhead every ~30px
          if (p.age % 20 === 0 && lifePct > 0.2 && lifePct < 0.8) {
            drawArrow(ctx, p.x, p.y, flowAngle, alpha);
          }
        }

        // Reset particle
        if (
          p.x < -50 ||
          p.x > canvas.width + 50 ||
          p.y < -50 ||
          p.y > canvas.height + 50 ||
          p.age >= p.maxAge
        ) {
          particles[i] = createWindParticle(canvas.width, canvas.height);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [windSpeed, windDir]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function createWindParticle(w: number, h: number) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    age: Math.floor(Math.random() * 60),
    maxAge: 80 + Math.random() * 100,
    speed: 0.5 + Math.random() * 1,
    opacity: 0.3 + Math.random() * 0.7,
  };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  alpha: number,
) {
  const size = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - Math.cos(angle - 0.4) * size,
    y - Math.sin(angle - 0.4) * size,
  );
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - Math.cos(angle + 0.4) * size,
    y - Math.sin(angle + 0.4) * size,
  );
  ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.6})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// ── Rain Overlay ─────────────────────────────────────────────

function RainOverlay({ intensity }: { intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drops: { x: number; y: number; speed: number; len: number }[] = [];
    for (let i = 0; i < intensity * 60; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 10 + Math.random() * 8 + intensity * 3,
        len: 6 + Math.random() * 10,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 0.5, d.y + d.len);
        ctx.strokeStyle = `rgba(147, 197, 253, ${0.15 + intensity * 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * canvas.width;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.3,
      }}
    />
  );
}

// ── Snow Overlay ─────────────────────────────────────────────

function SnowOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const flakes: {
      x: number;
      y: number;
      r: number;
      speed: number;
      wobble: number;
      phase: number;
    }[] = [];
    for (let i = 0; i < 80; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 2,
        speed: 0.4 + Math.random() * 1.2,
        wobble: 0.5 + Math.random(),
        phase: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;
      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(
          f.x + Math.sin(t * f.wobble + f.phase) * 15,
          f.y,
          f.r,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + f.r * 0.1})`;
        ctx.fill();
        f.y += f.speed;
        if (f.y > canvas.height + 5) {
          f.y = -5;
          f.x = Math.random() * canvas.width;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.4,
      }}
    />
  );
}

// ── Wind Compass Rose ────────────────────────────────────────

function WindCompass({ windSpeed, windDir }: { windSpeed: number; windDir: number }) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const arrowRotation = (windDir + 180) % 360;

  return (
    <div style={{ position: 'absolute', bottom: '240px', left: 'var(--space-4)', zIndex: 5, pointerEvents: 'none' }}>
      <div className="glass-panel" style={{ width: '76px', height: '76px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 0 }}>
        {dirs.map((d, i) => {
          const angle = i * 45;
          const rad = (angle - 90) * (Math.PI / 180);
          const r = 30;
          return (
            <span key={d} style={{ position: 'absolute', left: `${38 + Math.cos(rad) * r}px`, top: `${38 + Math.sin(rad) * r}px`, transform: 'translate(-50%, -50%)', fontSize: '0.4rem', fontWeight: d === 'N' ? 700 : 400, color: d === 'N' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
              {d}
            </span>
          );
        })}
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: `rotate(${arrowRotation}deg)`, transition: 'transform 0.8s ease' }}>
          <line x1="16" y1="26" x2="16" y2="5" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
          <polygon points="16,3 11,11 21,11" fill="var(--color-accent)" />
          <line x1="12" y1="26" x2="20" y2="26" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', fontWeight: 700, color: 'var(--color-text)', background: 'var(--color-surface-solid)', padding: '1px 5px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', fontFeatureSettings: "'tnum' on", whiteSpace: 'nowrap' }}>
          {windSpeed} mph
        </div>
      </div>
    </div>
  );
}
