import { describe, it, expect } from 'vitest';
import {
  fToC, cToF, kelvinToF,
  mphToKph, mphToKnots, mphToMs,
  mbToInHg, inHgToMb,
  inToMm, mmToIn,
  milesToKm, kmToMiles,
  degreesToCompass,
  roundTemp,
} from './conversions';

describe('Temperature conversions', () => {
  it('converts F to C', () => {
    expect(fToC(32)).toBeCloseTo(0);
    expect(fToC(212)).toBeCloseTo(100);
    expect(fToC(72)).toBeCloseTo(22.22, 1);
  });

  it('converts C to F', () => {
    expect(cToF(0)).toBeCloseTo(32);
    expect(cToF(100)).toBeCloseTo(212);
    expect(cToF(22)).toBeCloseTo(71.6, 1);
  });

  it('converts Kelvin to F', () => {
    expect(kelvinToF(273.15)).toBeCloseTo(32);
    expect(kelvinToF(373.15)).toBeCloseTo(212);
  });

  it('round-trips F → C → F', () => {
    for (const f of [-40, 0, 32, 72, 100, 212]) {
      expect(cToF(fToC(f))).toBeCloseTo(f);
    }
  });
});

describe('Wind speed conversions', () => {
  it('converts mph to kph', () => {
    expect(mphToKph(60)).toBeCloseTo(96.56, 0);
  });

  it('converts mph to knots', () => {
    expect(mphToKnots(100)).toBeCloseTo(86.9, 0);
  });

  it('converts mph to m/s', () => {
    expect(mphToMs(10)).toBeCloseTo(4.47, 1);
  });
});

describe('Pressure conversions', () => {
  it('converts mb to inHg', () => {
    expect(mbToInHg(1013.25)).toBeCloseTo(29.92, 1);
  });

  it('converts inHg to mb', () => {
    expect(inHgToMb(29.92)).toBeCloseTo(1013.25, 0);
  });
});

describe('Precipitation conversions', () => {
  it('converts inches to mm', () => {
    expect(inToMm(1)).toBeCloseTo(25.4);
  });

  it('converts mm to inches', () => {
    expect(mmToIn(25.4)).toBeCloseTo(1);
  });
});

describe('Distance conversions', () => {
  it('converts miles to km', () => {
    expect(milesToKm(1)).toBeCloseTo(1.609, 2);
  });

  it('converts km to miles', () => {
    expect(kmToMiles(1.609)).toBeCloseTo(1, 1);
  });
});

describe('Wind direction', () => {
  it('converts degrees to compass', () => {
    expect(degreesToCompass(0)).toBe('N');
    expect(degreesToCompass(90)).toBe('E');
    expect(degreesToCompass(180)).toBe('S');
    expect(degreesToCompass(270)).toBe('W');
    expect(degreesToCompass(45)).toBe('NE');
    expect(degreesToCompass(225)).toBe('SW');
  });

  it('handles 360 degrees as N', () => {
    expect(degreesToCompass(360)).toBe('N');
  });
});

describe('Rounding', () => {
  it('rounds temperature to nearest integer', () => {
    expect(roundTemp(72.4)).toBe(72);
    expect(roundTemp(72.6)).toBe(73);
  });
});
