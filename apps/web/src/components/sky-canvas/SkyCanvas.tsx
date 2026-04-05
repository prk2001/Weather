import { useRef, useEffect, useMemo } from 'react';
import type { WeatherCondition } from '@aether/shared';

interface SkyCanvasProps {
  condition?: WeatherCondition;
  cloudCover: number;
  hour: number;
  windSpeed: number;
  precipType?: string;
}

/**
 * Sky Canvas — CSS gradient background that adapts to weather conditions.
 * Phase 1: CSS gradients with smooth transitions
 * Phase 2 (future): Three.js with volumetric clouds, particles, stars
 */
export function SkyCanvas({ condition, cloudCover, hour, windSpeed: _windSpeed, precipType }: SkyCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const gradient = useMemo(() => {
    return computeSkyGradient(hour, cloudCover, condition, precipType);
  }, [hour, cloudCover, condition, precipType]);

  // Subtle parallax on mouse move
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 5;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      el!.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    }

    // Only enable on non-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        background: gradient,
        backgroundSize: '120% 120%',
        backgroundPosition: '50% 50%',
        transition: 'background 1s ease-out',
      }}
    >
      {/* Precipitation overlay */}
      {precipType && precipType !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            background: precipType === 'snow'
              ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1.5\' fill=\'white\'/%3E%3C/svg%3E")'
              : 'repeating-linear-gradient(transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)',
            animation: precipType === 'snow' ? 'snowfall 8s linear infinite' : 'rainfall 0.5s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Cloud overlay based on cloud cover */}
      {cloudCover > 40 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(128, 128, 128, ${Math.min(0.3, cloudCover / 300)})`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

function computeSkyGradient(
  hour: number,
  cloudCover: number,
  condition?: string,
  precipType?: string,
): string {
  // Severe override
  if (condition === 'severe_thunderstorm' || condition === 'tornado') {
    return 'linear-gradient(180deg, #1a0a0a 0%, #2d1a1a 40%, #3d2020 100%)';
  }

  // Snow
  if (precipType === 'snow' || condition === 'snow' || condition === 'blizzard') {
    return 'linear-gradient(180deg, #c4cdd4 0%, #dde3e8 40%, #eef1f4 100%)';
  }

  // Night (8pm - 5am)
  if (hour >= 20 || hour < 5) {
    return cloudCover > 60
      ? 'linear-gradient(180deg, #1a1a2e 0%, #2d2d44 50%, #3d3d55 100%)'
      : `linear-gradient(180deg, #0a0a1a 0%, #0f172a 40%, #1e293b 100%)`;
  }

  // Dawn/Dusk (5-7am, 7-8pm)
  if (hour >= 5 && hour < 7) {
    return 'linear-gradient(180deg, #1e293b 0%, #4a3660 25%, #c2556e 50%, #f0a050 80%, #f5d0a0 100%)';
  }
  if (hour >= 19 && hour < 20) {
    return 'linear-gradient(180deg, #2d3a5a 0%, #6e4470 25%, #d4606e 50%, #f0a050 80%, #f5c890 100%)';
  }

  // Rain
  if (condition === 'rain' || condition === 'heavy_rain' || condition === 'thunderstorm') {
    return 'linear-gradient(180deg, #3a4a5a 0%, #4a5a6a 40%, #5a6a7a 100%)';
  }

  // Overcast
  if (cloudCover > 80) {
    return 'linear-gradient(180deg, #8a9aaa 0%, #9aaabb 40%, #b0bec5 100%)';
  }

  // Partly cloudy day
  if (cloudCover > 40) {
    return 'linear-gradient(180deg, #5a8abf 0%, #7aabe0 40%, #a0c8f0 100%)';
  }

  // Clear day
  return 'linear-gradient(180deg, #1e6cc0 0%, #4a9ae0 30%, #87ceeb 60%, #c0e0f0 100%)';
}
