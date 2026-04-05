// ============================================================
// Unit Conversions — All internal storage is imperial (°F, mph, inHg, in, mi)
// ============================================================

import { WIND_DIRECTIONS } from '@aether/shared';

// ── Temperature ──────────────────────────────────────────────

export function fToC(f: number): number {
  return (f - 32) * (5 / 9);
}

export function cToF(c: number): number {
  return c * (9 / 5) + 32;
}

export function kelvinToF(k: number): number {
  return (k - 273.15) * (9 / 5) + 32;
}

export function kelvinToC(k: number): number {
  return k - 273.15;
}

// ── Wind Speed ───────────────────────────────────────────────

export function mphToKph(mph: number): number {
  return mph * 1.60934;
}

export function mphToKnots(mph: number): number {
  return mph * 0.868976;
}

export function mphToMs(mph: number): number {
  return mph * 0.44704;
}

export function kphToMph(kph: number): number {
  return kph / 1.60934;
}

export function knotsToMph(knots: number): number {
  return knots / 0.868976;
}

export function msToMph(ms: number): number {
  return ms / 0.44704;
}

// ── Pressure ─────────────────────────────────────────────────

export function mbToInHg(mb: number): number {
  return mb * 0.02953;
}

export function inHgToMb(inHg: number): number {
  return inHg / 0.02953;
}

export function hpaToInHg(hpa: number): number {
  return mbToInHg(hpa); // hPa === mb
}

export function mbToMmHg(mb: number): number {
  return mb * 0.75006;
}

// ── Precipitation ────────────────────────────────────────────

export function inToMm(inches: number): number {
  return inches * 25.4;
}

export function mmToIn(mm: number): number {
  return mm / 25.4;
}

// ── Distance ─────────────────────────────────────────────────

export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

export function kmToMiles(km: number): number {
  return km / 1.60934;
}

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

export function metersToFeet(meters: number): number {
  return meters / 0.3048;
}

// ── Wind Direction ───────────────────────────────────────────

export function degreesToCompass(degrees: number): string {
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return WIND_DIRECTIONS[index]!;
}

export function compassToDegrees(compass: string): number {
  const idx = WIND_DIRECTIONS.indexOf(compass as (typeof WIND_DIRECTIONS)[number]);
  return idx >= 0 ? idx * 22.5 : 0;
}

// ── Rounding Helpers ─────────────────────────────────────────

export function roundTemp(temp: number): number {
  return Math.round(temp);
}

export function roundWind(speed: number): number {
  return Math.round(speed);
}

export function roundPressure(pressure: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(pressure * factor) / factor;
}

export function roundPrecip(amount: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(amount * factor) / factor;
}
