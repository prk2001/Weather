// ============================================================
// Weather Calculations
// All inputs/outputs in imperial (°F, mph, inHg, in, mi) unless noted
// ============================================================

import { BEAUFORT_SCALE, AQI_BREAKPOINTS, UV_CATEGORIES, THRESHOLDS } from '@aether/shared';
import type { AqiCategory, UvCategory } from '@aether/shared';

// ── Feels Like (combines heat index + wind chill) ────────────

export function feelsLike(tempF: number, humidity: number, windMph: number): number {
  if (tempF >= 80 && humidity >= 40) {
    return heatIndex(tempF, humidity);
  }
  if (tempF <= 50 && windMph >= 3) {
    return windChill(tempF, windMph);
  }
  return tempF;
}

/**
 * NWS Heat Index (Rothfusz regression)
 */
export function heatIndex(tempF: number, humidity: number): number {
  // Simple formula first
  let hi = 0.5 * (tempF + 61.0 + (tempF - 68.0) * 1.2 + humidity * 0.094);

  if (hi >= 80) {
    // Full Rothfusz regression
    hi =
      -42.379 +
      2.04901523 * tempF +
      10.14333127 * humidity -
      0.22475541 * tempF * humidity -
      0.00683783 * tempF * tempF -
      0.05481717 * humidity * humidity +
      0.00122874 * tempF * tempF * humidity +
      0.00085282 * tempF * humidity * humidity -
      0.00000199 * tempF * tempF * humidity * humidity;

    // Adjustments
    if (humidity < 13 && tempF >= 80 && tempF <= 112) {
      hi -= ((13 - humidity) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
    } else if (humidity > 85 && tempF >= 80 && tempF <= 87) {
      hi += ((humidity - 85) / 10) * ((87 - tempF) / 5);
    }
  }

  return Math.round(hi);
}

/**
 * NWS Wind Chill (2001 formula)
 */
export function windChill(tempF: number, windMph: number): number {
  if (tempF > 50 || windMph < 3) return tempF;
  const wc =
    35.74 +
    0.6215 * tempF -
    35.75 * Math.pow(windMph, 0.16) +
    0.4275 * tempF * Math.pow(windMph, 0.16);
  return Math.round(wc);
}

/**
 * Wet Bulb Globe Temperature (simplified estimation)
 * Used for OSHA heat stress thresholds
 */
export function wbgt(tempF: number, humidity: number, _windMph?: number, _solarW?: number): number {
  const tempC = (tempF - 32) * (5 / 9);
  const e = (humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  // Simplified: WBGT ≈ 0.567*T + 0.393*e + 3.94 (outdoor, moderate sun)
  const wbgtC = 0.567 * tempC + 0.393 * e + 3.94;
  return Math.round(wbgtC * (9 / 5) + 32); // Return °F
}

// ── Dewpoint ─────────────────────────────────────────────────

/**
 * Calculate dewpoint from temp and humidity using Magnus formula
 */
export function dewpoint(tempF: number, humidity: number): number {
  const tempC = (tempF - 32) * (5 / 9);
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  const dewC = (b * alpha) / (a - alpha);
  return Math.round(dewC * (9 / 5) + 32);
}

/**
 * Dewpoint comfort category
 */
export function dewpointComfort(
  dewpointF: number,
): 'dry' | 'comfortable' | 'humid' | 'oppressive' | 'miserable' {
  const t = THRESHOLDS.dewpointComfort;
  if (dewpointF < t.dry) return 'dry';
  if (dewpointF < t.comfortable) return 'comfortable';
  if (dewpointF < t.humid) return 'humid';
  if (dewpointF < t.oppressive) return 'oppressive';
  return 'miserable';
}

// ── Beaufort Scale ───────────────────────────────────────────

export function beaufortForce(windMph: number): { force: number; label: string } {
  for (const entry of BEAUFORT_SCALE) {
    if (windMph <= entry.maxMph) {
      return { force: entry.force, label: entry.label };
    }
  }
  return { force: 12, label: 'Hurricane force' };
}

// ── AQI ──────────────────────────────────────────────────────

export function aqiCategory(aqi: number): { category: AqiCategory; color: string } {
  for (const bp of AQI_BREAKPOINTS) {
    if (aqi <= bp.max) {
      return { category: bp.category as AqiCategory, color: bp.color };
    }
  }
  return { category: 'hazardous' as AqiCategory, color: '#7F1D1D' };
}

// ── UV Index ─────────────────────────────────────────────────

export function uvCategory(uvIndex: number): { category: UvCategory; color: string } {
  for (const cat of UV_CATEGORIES) {
    if (uvIndex <= cat.max) {
      return { category: cat.category as UvCategory, color: cat.color };
    }
  }
  return { category: 'extreme' as UvCategory, color: '#A855F7' };
}

// ── Precipitation Type ───────────────────────────────────────

/**
 * Determine precipitation type from temperature profile
 * Simplified: uses surface temp and 850mb temp
 */
export function precipType(
  surfaceTempF: number,
  temp850mbF?: number,
): 'rain' | 'snow' | 'sleet' | 'freezing_rain' | 'mix' {
  if (surfaceTempF > 38) return 'rain';
  if (surfaceTempF < 28 && (!temp850mbF || temp850mbF < 32)) return 'snow';
  if (temp850mbF && temp850mbF > 32 && surfaceTempF < 32) return 'freezing_rain';
  if (temp850mbF && temp850mbF > 36 && surfaceTempF < 35) return 'sleet';
  return 'mix';
}

// ── Fog Probability ──────────────────────────────────────────

export function fogProbability(tempF: number, dewpointF: number, windMph: number): number {
  const depression = tempF - dewpointF;
  if (depression > 10 || windMph > 15) return 0;
  if (depression <= 2 && windMph < 5) return 90;
  if (depression <= 5 && windMph < 10) return 60;
  return Math.max(0, 100 - depression * 10 - windMph * 3);
}

// ── Frost Probability ────────────────────────────────────────

export function frostProbability(
  minTempF: number,
  cloudCover: number,
  windMph: number,
): number {
  if (minTempF > 40) return 0;
  if (minTempF > 36) {
    const base = 30;
    const cloudPenalty = cloudCover * 0.3; // Clouds trap heat
    const windPenalty = windMph * 3; // Wind prevents radiative cooling
    return Math.max(0, Math.min(100, base - cloudPenalty - windPenalty));
  }
  if (minTempF <= 32) {
    const base = 90;
    const cloudPenalty = cloudCover * 0.5;
    return Math.max(0, Math.min(100, base - cloudPenalty));
  }
  // 32-36°F
  const base = 60;
  const cloudPenalty = cloudCover * 0.4;
  const windPenalty = windMph * 2;
  return Math.max(0, Math.min(100, base - cloudPenalty - windPenalty));
}

// ── Solar Calculations (simplified) ──────────────────────────

/**
 * Calculate solar elevation angle
 * Used for golden/blue hour, sunrise/sunset
 */
export function solarElevation(lat: number, lon: number, date: Date): number {
  const dayOfYear =
    Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  const hourAngle =
    ((date.getUTCHours() + date.getUTCMinutes() / 60 + lon / 15 - 12) * 15 * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;

  const elevation = Math.asin(
    Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle),
  );

  return (elevation * 180) / Math.PI;
}

// ── Elevation Temperature Adjustment ─────────────────────────

/**
 * Standard lapse rate: -3.5°F per 1,000ft
 */
export function elevationAdjust(tempF: number, elevationFt: number, refElevationFt = 0): number {
  const deltaFt = elevationFt - refElevationFt;
  return tempF - (deltaFt / 1000) * 3.5;
}

// ── Temperature Severity (for UI font weight mapping) ────────

/**
 * Maps temperature to a severity 0-1 for font weight interpolation
 * 0 = mild/pleasant, 1 = extreme
 */
export function tempSeverity(tempF: number): number {
  // Pleasant range: 60-80°F = 0
  if (tempF >= 60 && tempF <= 80) return 0;

  // Cold side
  if (tempF < 60) {
    if (tempF >= 40) return (60 - tempF) / 60; // 0-0.33
    if (tempF >= 20) return 0.33 + (40 - tempF) / 60; // 0.33-0.66
    return Math.min(1, 0.66 + (20 - tempF) / 60); // 0.66-1.0
  }

  // Hot side
  if (tempF <= 95) return (tempF - 80) / 45; // 0-0.33
  if (tempF <= 105) return 0.33 + (tempF - 95) / 30; // 0.33-0.66
  return Math.min(1, 0.66 + (tempF - 105) / 30); // 0.66-1.0
}

/**
 * Map severity to font weight (300 pleasant → 800 extreme)
 */
export function tempFontWeight(tempF: number): number {
  const severity = tempSeverity(tempF);
  return Math.round(300 + severity * 500);
}
