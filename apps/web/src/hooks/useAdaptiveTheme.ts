import { useEffect } from 'react';
import type { WeatherCondition } from '@aether/shared';
import { AdaptiveTheme, THEME_COLORS } from '@aether/shared';

interface ThemeInput {
  condition?: WeatherCondition;
  hour?: number;
}

function resolveTheme(input: ThemeInput): AdaptiveTheme {
  const hour = input.hour ?? new Date().getHours();
  const isNight = hour < 6 || hour >= 20;
  const condition = input.condition;

  if (!condition) {
    return isNight ? AdaptiveTheme.NightClear : AdaptiveTheme.DayClear;
  }

  // Severe conditions override time-of-day
  if (
    condition === 'severe_thunderstorm' ||
    condition === 'tornado' ||
    condition === 'hurricane'
  ) {
    return AdaptiveTheme.Severe;
  }

  // Snow
  if (
    condition === 'snow' ||
    condition === 'heavy_snow' ||
    condition === 'light_snow' ||
    condition === 'blizzard'
  ) {
    return AdaptiveTheme.Snow;
  }

  // Rain
  if (
    condition === 'rain' ||
    condition === 'heavy_rain' ||
    condition === 'thunderstorm' ||
    condition === 'drizzle' ||
    condition === 'light_rain' ||
    condition === 'freezing_rain' ||
    condition === 'sleet'
  ) {
    return AdaptiveTheme.DayRain;
  }

  // Overcast
  if (condition === 'overcast' || condition === 'mostly_cloudy' || condition === 'fog') {
    return isNight ? AdaptiveTheme.NightCloudy : AdaptiveTheme.DayOvercast;
  }

  // Clear / partly cloudy
  if (isNight) {
    return condition === 'clear' ? AdaptiveTheme.NightClear : AdaptiveTheme.NightCloudy;
  }
  return condition === 'clear' ? AdaptiveTheme.DayClear : AdaptiveTheme.DayClear;
}

export function useAdaptiveTheme(input: ThemeInput) {
  useEffect(() => {
    const theme = resolveTheme(input);
    const colors = THEME_COLORS[theme];

    const root = document.documentElement;
    root.style.setProperty('--color-bg', colors.bg);
    root.style.setProperty('--color-surface', hexWithAlpha(colors.surface, 0.85));
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-accent', colors.accent);

    // Derive secondary/muted from text color
    root.style.setProperty(
      '--color-text-secondary',
      mixColors(colors.text, colors.bg, 0.6),
    );
    root.style.setProperty(
      '--color-text-muted',
      mixColors(colors.text, colors.bg, 0.4),
    );
    root.style.setProperty(
      '--color-surface-elevated',
      mixColors(colors.surface, colors.text, 0.08),
    );
    root.style.setProperty(
      '--color-border',
      mixColors(colors.surface, colors.text, 0.15),
    );
  }, [input.condition, input.hour]);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) =>
        Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function mixColors(color1: string, color2: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    r1 + (r2 - r1) * weight,
    g1 + (g2 - g1) * weight,
    b1 + (b2 - b1) * weight,
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
