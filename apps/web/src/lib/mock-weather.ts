// ============================================================
// Mock Weather Data Generator
// Produces realistic weather data for development
// Seeded by lat/lon + current time for determinism
// ============================================================

import type { CurrentConditions, HourlyForecast, DailyForecast } from '@aether/shared';
import { WeatherCondition, PrecipType, ForecastConfidence } from '@aether/shared';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getSeasonalBaseTemp(lat: number, dayOfYear: number): number {
  // Simplified: warmer near equator, seasonal variation by latitude
  const latEffect = Math.abs(lat) * 0.8;
  const seasonalAmplitude = Math.abs(lat) * 0.4;
  const seasonalOffset = Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI); // Peak warmth ~June 21
  const baseTemp = 75 - latEffect + seasonalAmplitude * seasonalOffset;
  return baseTemp;
}

function pickCondition(rand: () => number, precipProb: number): WeatherCondition {
  if (precipProb > 70) {
    const r = rand();
    if (r < 0.4) return WeatherCondition.Rain;
    if (r < 0.6) return WeatherCondition.HeavyRain;
    if (r < 0.8) return WeatherCondition.Thunderstorm;
    return WeatherCondition.LightRain;
  }
  if (precipProb > 30) {
    const r = rand();
    if (r < 0.3) return WeatherCondition.LightRain;
    if (r < 0.5) return WeatherCondition.Drizzle;
    return WeatherCondition.MostlyCloudy;
  }
  const r = rand();
  if (r < 0.3) return WeatherCondition.Clear;
  if (r < 0.6) return WeatherCondition.PartlyCloudy;
  if (r < 0.8) return WeatherCondition.MostlyCloudy;
  return WeatherCondition.Clear;
}

export function generateMockCurrent(lat: number, lon: number): CurrentConditions {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const hour = now.getHours();
  const seed = Math.floor(lat * 1000 + lon * 100 + dayOfYear);
  const rand = seededRandom(seed);

  const baseTemp = getSeasonalBaseTemp(lat, dayOfYear);
  const diurnalVariation = -8 * Math.cos(((hour - 14) / 24) * 2 * Math.PI); // Warmest at 2pm
  const temp = Math.round(baseTemp + diurnalVariation + (rand() - 0.5) * 10);

  const humidity = Math.round(40 + rand() * 40);
  const windSpeed = Math.round(3 + rand() * 15);
  const windDir = Math.round(rand() * 360);
  const pressure = Math.round((29.8 + (rand() - 0.5) * 0.6) * 100) / 100;
  const cloudCover = Math.round(rand() * 100);
  const precipProb = cloudCover > 70 ? Math.round(rand() * 60 + 20) : Math.round(rand() * 20);
  const uvIndex = hour >= 6 && hour <= 18 ? Math.round(rand() * 10) : 0;

  const dewpointC = ((temp - 32) * 5) / 9 - (100 - humidity) / 5;
  const dewpointF = Math.round(dewpointC * (9 / 5) + 32);

  // Simple feels-like
  let feelsLike = temp;
  if (temp >= 80 && humidity >= 40) feelsLike = temp + Math.round((humidity - 40) * 0.15);
  if (temp <= 50 && windSpeed >= 3) feelsLike = temp - Math.round(windSpeed * 0.5);

  const condition = pickCondition(rand, precipProb);

  return {
    location: { lat, lon },
    observedAt: now,
    temp,
    feelsLike,
    humidity,
    dewpoint: dewpointF,
    pressure: pressure * 33.8639, // Convert inHg to mb for internal storage
    pressureTrend: rand() > 0.6 ? 'rising' : rand() > 0.3 ? 'steady' : 'falling',
    windSpeed,
    windDir,
    windGust: windSpeed > 10 ? windSpeed + Math.round(rand() * 10) : undefined,
    visibility: Math.round(8 + rand() * 4),
    cloudCover,
    condition,
    precipType: precipProb > 50 ? PrecipType.Rain : PrecipType.None,
    uvIndex,
  };
}

export function generateMockHourly(lat: number, lon: number): HourlyForecast[] {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const hours: HourlyForecast[] = [];

  for (let i = 0; i < 48; i++) {
    const time = new Date(now.getTime() + i * 3600000);
    const hour = time.getHours();
    const seed = Math.floor(lat * 1000 + lon * 100 + dayOfYear + i * 7);
    const rand = seededRandom(seed);

    const baseTemp = getSeasonalBaseTemp(lat, dayOfYear + Math.floor(i / 24));
    const diurnal = -8 * Math.cos(((hour - 14) / 24) * 2 * Math.PI);
    const temp = Math.round(baseTemp + diurnal + (rand() - 0.5) * 8);

    const humidity = Math.round(40 + rand() * 40);
    const windSpeed = Math.round(3 + rand() * 15);
    const cloudCover = Math.round(rand() * 100);
    const precipProb = Math.round(rand() * 100);
    const uvIndex = hour >= 6 && hour <= 18 ? Math.round(rand() * 10) : 0;

    let feelsLike = temp;
    if (temp >= 80 && humidity >= 40) feelsLike = temp + Math.round((humidity - 40) * 0.15);
    if (temp <= 50 && windSpeed >= 3) feelsLike = temp - Math.round(windSpeed * 0.5);

    const dewpointC = ((temp - 32) * 5) / 9 - (100 - humidity) / 5;

    hours.push({
      time,
      temp,
      feelsLike,
      humidity,
      dewpoint: Math.round(dewpointC * (9 / 5) + 32),
      pressure: Math.round((1013 + (rand() - 0.5) * 20) * 10) / 10,
      windSpeed,
      windDir: Math.round(rand() * 360),
      windGust: windSpeed > 10 ? windSpeed + Math.round(rand() * 10) : undefined,
      cloudCover,
      condition: pickCondition(rand, precipProb),
      precipProb,
      precipAmount: precipProb > 50 ? Math.round(rand() * 50) / 100 : 0,
      precipType: precipProb > 50 && temp < 35 ? PrecipType.Snow : precipProb > 50 ? PrecipType.Rain : PrecipType.None,
      uvIndex,
      visibility: Math.round(5 + rand() * 7),
      confidence: precipProb > 60 || i > 24 ? ForecastConfidence.Medium : ForecastConfidence.High,
    });
  }

  return hours;
}

export function generateMockDaily(lat: number, lon: number): DailyForecast[] {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const days: DailyForecast[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() + i * 86400000);
    const seed = Math.floor(lat * 1000 + lon * 100 + dayOfYear + i * 31);
    const rand = seededRandom(seed);

    const baseTemp = getSeasonalBaseTemp(lat, dayOfYear + i);
    const highVariation = rand() * 8;
    const lowVariation = rand() * 8;
    const tempHigh = Math.round(baseTemp + highVariation);
    const tempLow = Math.round(baseTemp - 15 - lowVariation);

    const precipProb = Math.round(rand() * 100);
    const condition = pickCondition(rand, precipProb);

    // Sunrise/sunset approximations
    const sunrise = new Date(date);
    sunrise.setHours(6, Math.round(30 + rand() * 30), 0);
    const sunset = new Date(date);
    sunset.setHours(18, Math.round(30 + rand() * 60), 0);

    days.push({
      date,
      tempHigh,
      tempLow,
      feelsLikeHigh: tempHigh + Math.round((rand() - 0.5) * 6),
      feelsLikeLow: tempLow + Math.round((rand() - 0.5) * 6),
      humidity: Math.round(40 + rand() * 40),
      condition,
      conditionNight: pickCondition(rand, precipProb * 0.7),
      precipProb,
      precipAmount: precipProb > 50 ? Math.round(rand() * 100) / 100 : 0,
      precipType: precipProb > 50 && tempLow < 35 ? PrecipType.Snow : precipProb > 50 ? PrecipType.Rain : PrecipType.None,
      windSpeed: Math.round(5 + rand() * 15),
      windGust: rand() > 0.5 ? Math.round(15 + rand() * 20) : undefined,
      windDir: Math.round(rand() * 360),
      uvIndexMax: Math.round(2 + rand() * 9),
      sunrise,
      sunset,
      moonPhase: ((dayOfYear + i) % 30) / 30,
      goldenHourMorning: {
        start: new Date(sunrise.getTime() - 30 * 60000),
        end: new Date(sunrise.getTime() + 30 * 60000),
      },
      goldenHourEvening: {
        start: new Date(sunset.getTime() - 30 * 60000),
        end: new Date(sunset.getTime() + 30 * 60000),
      },
      narrative: generateNarrative(tempHigh, tempLow, precipProb, condition),
      confidence: i <= 3 ? ForecastConfidence.High : i <= 7 ? ForecastConfidence.Medium : ForecastConfidence.Low,
    });
  }

  return days;
}

function generateNarrative(
  high: number,
  low: number,
  precipProb: number,
  condition: WeatherCondition,
): string {
  const tempDesc =
    high >= 90 ? 'Hot' : high >= 80 ? 'Warm' : high >= 70 ? 'Pleasant' : high >= 60 ? 'Mild' : high >= 50 ? 'Cool' : 'Cold';

  if (precipProb > 70) {
    return `${tempDesc} with high ${high}°. Rain likely throughout the day. Low ${low}°.`;
  }
  if (precipProb > 40) {
    return `${tempDesc} with high ${high}°. Chance of showers. Low ${low}°.`;
  }
  if (condition === 'clear' || condition === 'partly_cloudy') {
    return `${tempDesc} and ${condition === 'clear' ? 'sunny' : 'partly cloudy'} with high ${high}°. Low ${low}°.`;
  }
  return `${tempDesc} with high ${high}°. ${condition === 'mostly_cloudy' ? 'Mostly cloudy' : 'Overcast'} skies. Low ${low}°.`;
}
