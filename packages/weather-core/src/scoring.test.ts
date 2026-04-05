import { describe, it, expect } from 'vitest';
import { scoreActivity, findBestWindows } from './scoring';
import type { HourlyForecast } from '@aether/shared';
import { WeatherCondition, PrecipType, ForecastConfidence } from '@aether/shared';

function makeHourly(overrides: Partial<HourlyForecast> = {}): HourlyForecast {
  return {
    time: new Date(),
    temp: 65,
    feelsLike: 65,
    humidity: 50,
    dewpoint: 50,
    pressure: 1013,
    windSpeed: 8,
    windDir: 180,
    cloudCover: 30,
    condition: WeatherCondition.PartlyCloudy,
    precipProb: 10,
    precipAmount: 0,
    precipType: PrecipType.None,
    uvIndex: 4,
    visibility: 10,
    confidence: ForecastConfidence.High,
    ...overrides,
  };
}

describe('scoreActivity', () => {
  it('scores running highly in ideal conditions', () => {
    const forecast = makeHourly({ temp: 55, windSpeed: 5, precipProb: 5, humidity: 50 });
    const result = scoreActivity('running', forecast);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toMatch(/Perfect|Great/);
  });

  it('penalizes running in extreme heat', () => {
    const forecast = makeHourly({ temp: 100, humidity: 70 });
    const result = scoreActivity('running', forecast);
    expect(result.score).toBeLessThan(70);
  });

  it('penalizes cycling in high wind', () => {
    const forecast = makeHourly({ windSpeed: 35 });
    const result = scoreActivity('cycling', forecast);
    expect(result.factors.some((f) => f.impact === 'dealbreaker')).toBe(true);
  });

  it('penalizes stargazing with cloud cover', () => {
    const forecast = makeHourly({ cloudCover: 90 });
    const result = scoreActivity('stargazing', forecast);
    expect(result.score).toBeLessThan(50);
  });

  it('gives good score for dog walking in mild weather', () => {
    const forecast = makeHourly({ temp: 60, windSpeed: 5, precipProb: 5 });
    const result = scoreActivity('dog_walking', forecast);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('returns fair score for unknown activity', () => {
    const forecast = makeHourly();
    const result = scoreActivity('unknown_sport', forecast);
    expect(result.score).toBe(50);
    expect(result.label).toBe('Fair');
  });
});

describe('findBestWindows', () => {
  it('finds top 3 windows from hourly data', () => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const time = new Date();
      time.setHours(time.getHours() + i);
      return makeHourly({
        time,
        temp: 50 + Math.sin((i / 24) * Math.PI * 2) * 15,
        precipProb: i > 12 ? 60 : 5,
      });
    });

    const windows = findBestWindows('running', hours, 2, 3);
    expect(windows).toHaveLength(3);
    expect(windows[0]!.score).toBeGreaterThanOrEqual(windows[1]!.score);
    expect(windows[1]!.score).toBeGreaterThanOrEqual(windows[2]!.score);
  });

  it('returns windows with correct duration', () => {
    const hours = Array.from({ length: 12 }, (_, i) => {
      const time = new Date();
      time.setHours(time.getHours() + i);
      return makeHourly({ time });
    });

    const windows = findBestWindows('hiking', hours, 3, 2);
    expect(windows[0]!.window!.durationHours).toBe(3);
  });
});
