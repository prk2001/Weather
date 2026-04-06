import type { HourlyForecast } from '@aether/shared';
import { roundTemp } from '@aether/weather-core';

interface ForecastFanProps {
  hourly: HourlyForecast[];
  onClose: () => void;
}

/**
 * Forecast Confidence Fan — inspired by Acme Weather's "alternate predictions"
 * Shows the primary forecast as a solid line, with a shaded cone representing
 * the range of possible outcomes. Wider cone = more uncertainty.
 * This is AETHER's way of "embracing uncertainty" — honest, visual, useful.
 */
export function ForecastFan({ hourly, onClose }: ForecastFanProps) {
  if (hourly.length < 6) return null;

  const hours = hourly.slice(0, 24);
  const temps = hours.map((h) => h.temp);
  const minT = Math.min(...temps) - 5;
  const maxT = Math.max(...temps) + 5;
  const range = maxT - minT || 1;

  const W = 520;
  const H = 200;
  const padL = 40;
  const padR = 10;
  const padT = 20;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Generate forecast points
  const points = hours.map((h, i) => {
    const x = padL + (i / (hours.length - 1)) * chartW;
    const y = padT + (1 - (h.temp - minT) / range) * chartH;
    // Uncertainty grows with time — ±2°F at hour 0, ±8°F at hour 24
    const uncertainty = 2 + (i / hours.length) * 6;
    const yHigh = padT + (1 - (h.temp + uncertainty - minT) / range) * chartH;
    const yLow = padT + (1 - (h.temp - uncertainty - minT) / range) * chartH;
    return { x, y, yHigh, yLow, temp: h.temp, time: new Date(h.time) };
  });

  // Build SVG paths
  const mainLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const upperBound = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yHigh}`).join(' ');
  const lowerBound = [...points].reverse().map((p, i) => `${i === 0 ? 'L' : 'L'} ${p.x} ${p.yLow}`).join(' ');
  const fanPath = `${upperBound} ${lowerBound} Z`;

  // Precip bars
  const precipBars = hours.map((h, i) => {
    const x = padL + (i / (hours.length - 1)) * chartW;
    const barHeight = (h.precipProb / 100) * 20;
    return { x, height: barHeight, prob: h.precipProb };
  });

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
          maxWidth: '580px', width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{'📊'} Forecast Confidence</h2>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Shaded area shows the range of possible outcomes — wider = more uncertainty
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {/* Chart */}
        <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {Array.from({ length: 5 }, (_, i) => {
              const y = padT + (i / 4) * chartH;
              const temp = Math.round(maxT - (i / 4) * range);
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <text x={padL - 6} y={y + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize="9" fontFamily="Inter, sans-serif">
                    {temp}°
                  </text>
                </g>
              );
            })}

            {/* Time labels */}
            {points.filter((_, i) => i % 4 === 0).map((p) => (
              <text key={p.x} x={p.x} y={H - 6} textAnchor="middle" fill="var(--color-text-muted)" fontSize="8" fontFamily="Inter, sans-serif">
                {p.time.getHours() === 0 ? '12a' : p.time.getHours() === 12 ? '12p' : p.time.getHours() < 12 ? `${p.time.getHours()}a` : `${p.time.getHours() - 12}p`}
              </text>
            ))}

            {/* Precip probability bars at bottom */}
            {precipBars.map((bar, i) => (
              bar.prob > 10 && (
                <rect
                  key={i}
                  x={bar.x - 4}
                  y={H - padB - bar.height}
                  width={8}
                  height={bar.height}
                  fill="rgba(59, 130, 246, 0.25)"
                  rx={2}
                />
              )
            ))}

            {/* Confidence fan (shaded area) */}
            <path d={fanPath} fill="url(#fanGradient)" opacity={0.4} />

            {/* Inner confidence band (narrower, darker) */}
            <path
              d={points.map((p, i) => {
                const innerU = 1 + (i / hours.length) * 3;
                const yH = padT + (1 - (p.temp + innerU - minT) / range) * chartH;
                return `${i === 0 ? 'M' : 'L'} ${p.x} ${yH}`;
              }).join(' ') + ' ' + [...points].reverse().map((p, i) => {
                const idx = hours.length - 1 - i;
                const innerU = 1 + (idx / hours.length) * 3;
                const yL = padT + (1 - (p.temp - innerU - minT) / range) * chartH;
                return `L ${p.x} ${yL}`;
              }).join(' ') + ' Z'}
              fill="url(#fanGradient)"
              opacity={0.5}
            />

            {/* Main forecast line */}
            <path d={mainLine} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Current point dot */}
            <circle cx={points[0]!.x} cy={points[0]!.y} r="4" fill="var(--color-accent)" stroke="var(--color-surface-solid)" strokeWidth="2" />
            <text x={points[0]!.x + 8} y={points[0]!.y - 6} fill="var(--color-text)" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">
              {roundTemp(points[0]!.temp)}°
            </text>

            {/* Gradient definition */}
            <defs>
              <linearGradient id="fanGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.6rem', color: 'var(--color-text-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '16px', height: '2px', background: 'var(--color-accent)', borderRadius: '1px' }} />
            <span>Primary forecast</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '16px', height: '8px', background: 'rgba(45,212,191,0.2)', borderRadius: '2px' }} />
            <span>Possible range</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', background: 'rgba(59,130,246,0.25)', borderRadius: '2px' }} />
            <span>Rain chance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
