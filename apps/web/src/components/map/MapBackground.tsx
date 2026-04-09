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

// Base maps — using OSM which supports zoom 0-19 everywhere without "Zoom Level Not Supported"
const BASE_MAPS: Record<string, string> = {
  dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite_base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

// OpenWeatherMap tile layers — real weather data heatmaps
const OWM_KEY = '44b2f6cf4619f41dc555df49f5080fad';
const OWM_TILES = {
  temp: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  clouds: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  precip: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  pressure: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
};

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

  // All radar frames for animation (past + nowcast)
  const [radarFrames, setRadarFrames] = useState<{ path: string; time: number }[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch RainViewer tile URLs + all frames on mount
  useEffect(() => {
    fetch(RAINVIEWER_API)
      .then((r) => r.json())
      .then((data) => {
        const pastFrames: { path: string; time: number }[] = data?.radar?.past ?? [];
        const nowcastFrames: { path: string; time: number }[] = data?.radar?.nowcast ?? [];
        const allFrames = [...pastFrames, ...nowcastFrames];
        setRadarFrames(allFrames);

        const satFrames = data?.satellite?.infrared;
        const latestRadar = allFrames[allFrames.length - 1];
        const latestSat = satFrames?.[satFrames.length - 1];
        setRainviewerTiles({
          radar: latestRadar
            ? `https://tilecache.rainviewer.com${latestRadar.path}/256/{z}/{x}/{y}/2/1_1.png`
            : null,
          satellite: latestSat
            ? `https://tilecache.rainviewer.com${latestSat.path}/256/{z}/{x}/{y}/0/0_0.png`
            : null,
        });
        // Start at the last past frame (current time)
        setCurrentFrame(pastFrames.length - 1);
      })
      .catch(() => { /* offline fallback */ });
  }, []);

  // Animation playback
  useEffect(() => {
    if (isPlaying && radarFrames.length > 0) {
      animIntervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % radarFrames.length);
      }, 500);
    }
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [isPlaying, radarFrames.length]);

  // Update radar overlay tile URL when frame changes
  useEffect(() => {
    if (radarFrames.length > 0 && radarFrames[currentFrame]) {
      const frame = radarFrames[currentFrame]!;
      setRainviewerTiles((prev) => ({
        ...prev,
        radar: `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      }));
    }
  }, [currentFrame, radarFrames]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 7,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      keyboard: false,
    });

    // Create a custom pane for base tiles so we can darken them without affecting weather overlays
    map.createPane('basePane');
    const basePane = map.getPane('basePane');
    if (basePane) {
      basePane.style.zIndex = '100';
      basePane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.8) contrast(1.2) saturate(0.3)';
    }

    // OSM base map — supports zoom 0-19 everywhere, no "Zoom Level Not Supported"
    L.tileLayer(BASE_MAPS.dark!, {
      subdomains: 'abc',
      maxZoom: 19,
      attribution: '',
      pane: 'basePane',
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

    // Map is freely explorable — click to get weather for a specific spot

    // GLOBAL zoom handler: hide entire overlay pane when zoomed past tile limits
    // This is the bulletproof fix — CSS visibility hides everything instantly
    map.on('zoomend', () => {
      const z = map.getZoom();
      const overlayPane = map.getPane('overlayPane');
      // Weather tiles fail above zoom 12 — hide them entirely
      if (z > 12) {
        if (overlayPane) overlayPane.style.opacity = '0';
        // Also hide any weather tile layers in the tile pane
        const weatherTiles = document.querySelectorAll('.leaflet-tile-pane .leaflet-layer:not(:first-child)');
        weatherTiles.forEach((el) => { (el as HTMLElement).style.display = 'none'; });
      } else {
        if (overlayPane) overlayPane.style.opacity = '1';
        const weatherTiles = document.querySelectorAll('.leaflet-tile-pane .leaflet-layer:not(:first-child)');
        weatherTiles.forEach((el) => { (el as HTMLElement).style.display = ''; });
      }
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

  // Only re-center map when user explicitly searches a new location
  // (not on every weather data refresh from clicking the map)
  const lastSearchRef = useRef('');
  useEffect(() => {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (key !== lastSearchRef.current) {
      lastSearchRef.current = key;
      leafletMap.current?.setView([lat, lon], 7, { animate: true });
    }
  }, [lat, lon]);

  // Switch weather overlay layer
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Remove all previous overlays and zoom handler
    const prevOverlays = (map as unknown as Record<string, L.TileLayer[]>)._aetherOverlays ?? [];
    for (const ol of prevOverlays) {
      if (map.hasLayer(ol)) map.removeLayer(ol);
    }
    const prevZoomHandler = (map as unknown as Record<string, () => void>)._aetherZoomHandler;
    if (prevZoomHandler) map.off('zoomend', prevZoomHandler);
    overlayRef.current = null;

    // Each layer gets DISTINCT visuals — not just the same radar tiles
    const overlays: { url: string; opacity: number }[] = [];
    // Layer-specific visuals determined by tile selection below

    switch (layer) {
      case 'radar':
        // RainViewer radar — real-time precipitation returns
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.8 });

        break;
      case 'satellite':
        // ESRI satellite imagery + cloud IR overlay
        overlays.push({ url: BASE_MAPS.satellite_base!, opacity: 0.85 });
        if (rainviewerTiles.satellite) overlays.push({ url: rainviewerTiles.satellite, opacity: 0.5 });

        break;
      case 'wind':
        // OWM wind speed heatmap + canvas particles on top
        overlays.push({ url: OWM_TILES.wind, opacity: 0.85 });

        break;
      case 'rain':
        // OWM precipitation intensity + RainViewer radar composite
        overlays.push({ url: OWM_TILES.precip, opacity: 0.8 });
        if (rainviewerTiles.radar) overlays.push({ url: rainviewerTiles.radar, opacity: 0.4 });

        break;
      case 'temperature':
        // OWM temperature heatmap — the colorful one
        overlays.push({ url: OWM_TILES.temp, opacity: 0.85 });

        break;
      case 'clouds':
        // OWM cloud cover + RainViewer satellite IR
        overlays.push({ url: OWM_TILES.clouds, opacity: 0.8 });
        if (rainviewerTiles.satellite) overlays.push({ url: rainviewerTiles.satellite, opacity: 0.3 });

        break;
    }

    // tileFilter no longer applied — weather overlays show natural colors
    // Base map darkening is handled by the custom basePane filter

    // Add overlay tile layers with zoom-based visibility
    const tileLayers: { layer: L.TileLayer; maxZoom: number }[] = [];
    for (const ov of overlays) {
      const isRV = ov.url.includes('rainviewer');
      const isOWM = ov.url.includes('openweathermap');
      const safeMaxZoom = isRV ? 11 : isOWM ? 14 : 18;
      const tl = L.tileLayer(ov.url, {
        opacity: ov.opacity,
        maxZoom: safeMaxZoom,
        errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
      });
      // Only add if current zoom is within safe range
      if (map.getZoom() <= safeMaxZoom) {
        tl.addTo(map);
      }
      tileLayers.push({ layer: tl, maxZoom: safeMaxZoom });
    }

    // Hide/show overlays based on zoom level — prevents "Zoom Level Not Supported"
    const onZoom = () => {
      const z = map.getZoom();
      for (const { layer: tl, maxZoom: mz } of tileLayers) {
        if (z > mz && map.hasLayer(tl)) {
          map.removeLayer(tl);
        } else if (z <= mz && !map.hasLayer(tl)) {
          tl.addTo(map);
        }
      }
    };
    map.on('zoomend', onZoom);

    if (tileLayers[0]) overlayRef.current = tileLayers[0].layer;
    (map as unknown as Record<string, L.TileLayer[]>)._aetherOverlays = tileLayers.map(t => t.layer);
    (map as unknown as Record<string, () => void>)._aetherZoomHandler = onZoom;
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

      {/* Radar animation time scrubber */}
      {radarFrames.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '46px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'var(--color-surface)',
            backdropFilter: 'var(--blur-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            pointerEvents: 'auto',
          }}
        >
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text)',
              fontSize: '0.9rem', cursor: 'pointer', padding: '0 2px',
            }}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          {/* Time scrubber */}
          <input
            type="range"
            min={0}
            max={radarFrames.length - 1}
            value={currentFrame}
            onChange={(e) => { setIsPlaying(false); setCurrentFrame(Number(e.target.value)); }}
            style={{
              width: '180px',
              accentColor: 'var(--color-accent)',
              cursor: 'pointer',
            }}
          />

          {/* Current time label */}
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: currentFrame >= radarFrames.length - (radarFrames.length > 12 ? 6 : 0)
              ? 'var(--color-accent)' : 'var(--color-text)',
            fontFeatureSettings: "'tnum' on",
            minWidth: '55px',
            textAlign: 'center',
          }}>
            {radarFrames[currentFrame]
              ? new Date(radarFrames[currentFrame]!.time * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : '--'}
          </span>
        </div>
      )}

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

      {/* Hide attribution, dark background */}
      <style>{`
        .leaflet-container { background: #0a0e17 !important; }
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
