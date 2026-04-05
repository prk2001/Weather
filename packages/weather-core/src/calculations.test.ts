import { describe, it, expect } from 'vitest';
import {
  feelsLike, heatIndex, windChill, dewpoint, dewpointComfort,
  beaufortForce, aqiCategory, uvCategory, precipType,
  fogProbability, frostProbability, tempSeverity, tempFontWeight,
  elevationAdjust,
} from './calculations';

describe('feelsLike', () => {
  it('returns heat index when hot and humid', () => {
    const fl = feelsLike(95, 60, 5);
    expect(fl).toBeGreaterThan(95); // Should feel hotter
  });

  it('returns wind chill when cold and windy', () => {
    const fl = feelsLike(30, 50, 20);
    expect(fl).toBeLessThan(30); // Should feel colder
  });

  it('returns ambient temp in comfortable range', () => {
    expect(feelsLike(70, 50, 5)).toBe(70);
  });
});

describe('heatIndex', () => {
  it('calculates correctly for known values', () => {
    // NWS reference: 90°F + 50% RH ≈ 95°F heat index
    const hi = heatIndex(90, 50);
    expect(hi).toBeGreaterThanOrEqual(92);
    expect(hi).toBeLessThanOrEqual(98);
  });
});

describe('windChill', () => {
  it('calculates correctly for known values', () => {
    // NWS reference: 30°F + 15mph ≈ 19°F wind chill
    const wc = windChill(30, 15);
    expect(wc).toBeGreaterThanOrEqual(17);
    expect(wc).toBeLessThanOrEqual(22);
  });

  it('returns temp unchanged when warm', () => {
    expect(windChill(55, 15)).toBe(55);
  });

  it('returns temp unchanged when wind is calm', () => {
    expect(windChill(30, 2)).toBe(30);
  });
});

describe('dewpoint', () => {
  it('calculates dewpoint from temp and humidity', () => {
    const dp = dewpoint(72, 50);
    expect(dp).toBeGreaterThanOrEqual(48);
    expect(dp).toBeLessThanOrEqual(56);
  });
});

describe('dewpointComfort', () => {
  it('classifies comfort levels correctly', () => {
    expect(dewpointComfort(50)).toBe('dry');
    expect(dewpointComfort(57)).toBe('comfortable');
    expect(dewpointComfort(62)).toBe('humid');
    expect(dewpointComfort(68)).toBe('oppressive');
    expect(dewpointComfort(78)).toBe('miserable');
  });
});

describe('beaufortForce', () => {
  it('returns correct force for calm', () => {
    expect(beaufortForce(0).force).toBe(0);
    expect(beaufortForce(0).label).toBe('Calm');
  });

  it('returns correct force for gale', () => {
    expect(beaufortForce(40).force).toBe(8);
  });

  it('returns hurricane force for extreme wind', () => {
    expect(beaufortForce(80).force).toBe(12);
  });
});

describe('aqiCategory', () => {
  it('classifies AQI correctly', () => {
    expect(aqiCategory(25).category).toBe('good');
    expect(aqiCategory(75).category).toBe('moderate');
    expect(aqiCategory(125).category).toBe('unhealthy_sensitive');
    expect(aqiCategory(175).category).toBe('unhealthy');
  });
});

describe('uvCategory', () => {
  it('classifies UV correctly', () => {
    expect(uvCategory(1).category).toBe('low');
    expect(uvCategory(4).category).toBe('moderate');
    expect(uvCategory(7).category).toBe('high');
    expect(uvCategory(9).category).toBe('very_high');
    expect(uvCategory(12).category).toBe('extreme');
  });
});

describe('precipType', () => {
  it('returns rain for warm temps', () => {
    expect(precipType(45)).toBe('rain');
  });

  it('returns snow for cold temps', () => {
    expect(precipType(25, 28)).toBe('snow');
  });

  it('returns freezing rain for warm aloft, cold surface', () => {
    expect(precipType(30, 36)).toBe('freezing_rain');
  });
});

describe('fogProbability', () => {
  it('returns high probability with low dewpoint depression and calm wind', () => {
    expect(fogProbability(50, 49, 3)).toBeGreaterThanOrEqual(80);
  });

  it('returns zero with large depression', () => {
    expect(fogProbability(70, 50, 5)).toBe(0);
  });
});

describe('frostProbability', () => {
  it('returns zero when warm', () => {
    expect(frostProbability(50, 50, 5)).toBe(0);
  });

  it('returns high when freezing, clear, calm', () => {
    expect(frostProbability(30, 10, 2)).toBeGreaterThanOrEqual(70);
  });
});

describe('tempSeverity', () => {
  it('returns 0 for pleasant temps', () => {
    expect(tempSeverity(70)).toBe(0);
    expect(tempSeverity(65)).toBe(0);
  });

  it('returns higher values for extreme temps', () => {
    expect(tempSeverity(100)).toBeGreaterThan(0.3);
    expect(tempSeverity(10)).toBeGreaterThan(0.3);
    expect(tempSeverity(-10)).toBeGreaterThan(0.6);
  });
});

describe('tempFontWeight', () => {
  it('returns light weight for pleasant temps', () => {
    expect(tempFontWeight(70)).toBe(300);
  });

  it('returns heavier weight for extreme temps', () => {
    expect(tempFontWeight(105)).toBeGreaterThan(500);
    expect(tempFontWeight(0)).toBeGreaterThan(500);
  });
});

describe('elevationAdjust', () => {
  it('adjusts temperature by standard lapse rate', () => {
    // 3.5°F cooler per 1000ft
    expect(elevationAdjust(72, 5000, 0)).toBeCloseTo(54.5);
  });
});
