// ============================================================
// NWS Weather API Client — Free, no API key required
// https://api.weather.gov
// ============================================================

import type {
  CurrentConditions,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
} from '@aether/shared';
import {
  WeatherCondition,
  PrecipType,
  ForecastConfidence,
  AlertSeverity,
  AlertUrgency,
  AlertCertainty,
} from '@aether/shared';

const NWS_BASE = 'https://api.weather.gov';
const USER_AGENT = 'AETHER/1.0 (aether.weather; contact@aether.weather)';

async function nwsFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/geo+json',
    },
  });
  if (!res.ok) throw new Error(`NWS API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Step 1: Get grid point info for a lat/lon ────────────────

interface GridPoint {
  gridId: string;
  gridX: number;
  gridY: number;
  forecastUrl: string;
  forecastHourlyUrl: string;
  observationStationsUrl: string;
  timeZone: string;
  city: string;
  state: string;
}

export async function getGridPoint(lat: number, lon: number): Promise<GridPoint> {
  const data = await nwsFetch(`${NWS_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
  const props = data.properties;
  return {
    gridId: props.gridId,
    gridX: props.gridX,
    gridY: props.gridY,
    forecastUrl: props.forecast,
    forecastHourlyUrl: props.forecastHourly,
    observationStationsUrl: props.observationStations,
    timeZone: props.timeZone,
    city: props.relativeLocation?.properties?.city ?? '',
    state: props.relativeLocation?.properties?.state ?? '',
  };
}

// ── Step 2: Get current conditions from nearest station ──────

export async function fetchCurrentConditions(
  lat: number,
  lon: number,
  grid: GridPoint,
): Promise<CurrentConditions> {
  // Get nearest observation station
  const stationsData = await nwsFetch(grid.observationStationsUrl);
  const stationUrl = stationsData.features?.[0]?.id;
  if (!stationUrl) throw new Error('No observation stations found');

  // Get latest observation
  const obsData = await nwsFetch(`${stationUrl}/observations/latest`);
  const obs = obsData.properties;

  const tempC = obs.temperature?.value;
  const tempF = tempC != null ? tempC * 9 / 5 + 32 : 70;
  const humidity = obs.relativeHumidity?.value ?? 50;
  const windSpeedMs = obs.windSpeed?.value;
  const windMph = windSpeedMs != null ? windSpeedMs * 2.237 : 5;
  const windDir = obs.windDirection?.value ?? 0;
  const windGustMs = obs.windGust?.value;
  const gustMph = windGustMs != null ? windGustMs * 2.237 : undefined;
  const pressurePa = obs.barometricPressure?.value;
  const pressureMb = pressurePa != null ? pressurePa / 100 : 1013;
  const visibilityM = obs.visibility?.value;
  const visibilityMi = visibilityM != null ? visibilityM / 1609.34 : 10;
  const dewpointC = obs.dewpoint?.value;
  const dewpointF = dewpointC != null ? dewpointC * 9 / 5 + 32 : 55;

  // Feels like
  let feelsLike = tempF;
  if (tempF >= 80 && humidity >= 40) {
    feelsLike = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity
      - 0.22475541 * tempF * humidity - 0.00683783 * tempF * tempF
      - 0.05481717 * humidity * humidity + 0.00122874 * tempF * tempF * humidity
      + 0.00085282 * tempF * humidity * humidity
      - 0.00000199 * tempF * tempF * humidity * humidity;
  } else if (tempF <= 50 && windMph >= 3) {
    feelsLike = 35.74 + 0.6215 * tempF - 35.75 * Math.pow(windMph, 0.16)
      + 0.4275 * tempF * Math.pow(windMph, 0.16);
  }

  const condition = mapNwsCondition(obs.textDescription ?? 'Cloudy');

  return {
    location: { lat, lon },
    observedAt: new Date(obs.timestamp ?? Date.now()),
    temp: Math.round(tempF),
    feelsLike: Math.round(feelsLike),
    humidity: Math.round(humidity),
    dewpoint: Math.round(dewpointF),
    pressure: Math.round(pressureMb * 10) / 10,
    pressureTrend: 'steady',
    windSpeed: Math.round(windMph),
    windDir: Math.round(windDir),
    windGust: gustMph ? Math.round(gustMph) : undefined,
    visibility: Math.round(visibilityMi * 10) / 10,
    cloudCover: mapCloudCover(obs.textDescription ?? ''),
    condition,
    precipType: PrecipType.None,
    uvIndex: estimateUV(lat, new Date()),
  };
}

// ── Step 3: Get hourly forecast ──────────────────────────────

export async function fetchHourlyForecast(grid: GridPoint): Promise<HourlyForecast[]> {
  const data = await nwsFetch(grid.forecastHourlyUrl);
  const periods = data.properties?.periods ?? [];

  return periods.slice(0, 48).map((p: Record<string, unknown>) => {
    const tempF = typeof p.temperature === 'number' ? p.temperature : 70;
    const windStr = typeof p.windSpeed === 'string' ? p.windSpeed : '5 mph';
    const windMph = parseInt(windStr) || 5;
    const windDirStr = typeof p.windDirection === 'string' ? p.windDirection : 'N';
    const windDeg = compassToDeg(windDirStr);
    const desc = typeof p.shortForecast === 'string' ? p.shortForecast : 'Cloudy';
    const precip = typeof (p as Record<string, unknown>).probabilityOfPrecipitation === 'object'
      ? ((p as Record<string, unknown>).probabilityOfPrecipitation as Record<string, unknown>)?.value as number ?? 0
      : 0;
    const time = new Date(p.startTime as string);

    return {
      time,
      temp: tempF,
      feelsLike: tempF,
      humidity: typeof (p as Record<string, unknown>).relativeHumidity === 'object'
        ? ((p as Record<string, unknown>).relativeHumidity as Record<string, unknown>)?.value as number ?? 50
        : 50,
      dewpoint: tempF - 15,
      pressure: 1013,
      windSpeed: windMph,
      windDir: windDeg,
      windGust: windMph > 15 ? windMph + 10 : undefined,
      cloudCover: mapCloudCover(desc),
      condition: mapNwsCondition(desc),
      precipProb: precip,
      precipAmount: precip > 50 ? 0.1 : 0,
      precipType: desc.toLowerCase().includes('snow') ? PrecipType.Snow
        : precip > 30 ? PrecipType.Rain : PrecipType.None,
      uvIndex: estimateUV(0, time),
      visibility: 10,
      confidence: ForecastConfidence.High,
    };
  });
}

// ── Step 4: Get daily forecast ───────────────────────────────

export async function fetchDailyForecast(grid: GridPoint): Promise<DailyForecast[]> {
  const data = await nwsFetch(grid.forecastUrl);
  const periods = data.properties?.periods ?? [];

  // NWS returns alternating day/night periods — pair them up
  const days: DailyForecast[] = [];
  let i = 0;

  while (i < periods.length && days.length < 14) {
    const period = periods[i] as Record<string, unknown>;
    const isDaytime = period.isDaytime as boolean;

    let dayPeriod: Record<string, unknown>;
    let nightPeriod: Record<string, unknown> | null = null;

    if (isDaytime) {
      dayPeriod = period;
      if (i + 1 < periods.length) {
        nightPeriod = periods[i + 1] as Record<string, unknown>;
        i += 2;
      } else {
        i++;
      }
    } else {
      // Started with a night period (today is already evening)
      dayPeriod = period;
      i++;
    }

    const tempHigh = typeof dayPeriod.temperature === 'number' ? dayPeriod.temperature : 75;
    const tempLow = nightPeriod && typeof nightPeriod.temperature === 'number'
      ? nightPeriod.temperature : tempHigh - 20;
    const desc = typeof dayPeriod.shortForecast === 'string' ? dayPeriod.shortForecast : 'Cloudy';
    const nightDesc = nightPeriod && typeof nightPeriod.shortForecast === 'string'
      ? nightPeriod.shortForecast : desc;
    const windStr = typeof dayPeriod.windSpeed === 'string' ? dayPeriod.windSpeed : '5 mph';
    const windMph = parseInt(windStr) || 5;
    const precip = typeof (dayPeriod as Record<string, unknown>).probabilityOfPrecipitation === 'object'
      ? ((dayPeriod as Record<string, unknown>).probabilityOfPrecipitation as Record<string, unknown>)?.value as number ?? 0
      : 0;

    const startTime = new Date(dayPeriod.startTime as string);
    const sunrise = new Date(startTime);
    sunrise.setHours(6, 45, 0);
    const sunset = new Date(startTime);
    sunset.setHours(19, 50, 0);

    const narrative = typeof dayPeriod.detailedForecast === 'string'
      ? dayPeriod.detailedForecast
      : `High ${tempHigh}°, low ${tempLow}°.`;

    days.push({
      date: startTime,
      tempHigh,
      tempLow,
      feelsLikeHigh: tempHigh,
      feelsLikeLow: tempLow,
      humidity: 55,
      condition: mapNwsCondition(desc),
      conditionNight: mapNwsCondition(nightDesc),
      precipProb: precip,
      precipAmount: precip > 50 ? 0.25 : 0,
      precipType: desc.toLowerCase().includes('snow') ? PrecipType.Snow
        : precip > 30 ? PrecipType.Rain : PrecipType.None,
      windSpeed: windMph,
      windGust: windMph > 15 ? windMph + 12 : undefined,
      windDir: 180,
      uvIndexMax: estimateUV(0, startTime),
      sunrise,
      sunset,
      moonPhase: (startTime.getDate() % 30) / 30,
      goldenHourMorning: {
        start: new Date(sunrise.getTime() - 30 * 60000),
        end: new Date(sunrise.getTime() + 30 * 60000),
      },
      goldenHourEvening: {
        start: new Date(sunset.getTime() - 30 * 60000),
        end: new Date(sunset.getTime() + 30 * 60000),
      },
      narrative: narrative.length > 200 ? narrative.substring(0, 200) + '...' : narrative,
      confidence: days.length <= 3 ? ForecastConfidence.High
        : days.length <= 7 ? ForecastConfidence.Medium : ForecastConfidence.Low,
    });
  }

  return days;
}

// ── Step 5: Get active alerts ────────────────────────────────

export async function fetchAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  const data = await nwsFetch(`${NWS_BASE}/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`);
  const features = data.features ?? [];

  return features.map((f: Record<string, unknown>) => {
    const props = f.properties as Record<string, unknown>;
    return {
      id: props.id as string ?? `alert-${Date.now()}`,
      type: props.event as string ?? 'Weather Alert',
      severity: mapSeverity(props.severity as string),
      urgency: mapUrgency(props.urgency as string),
      certainty: mapCertainty(props.certainty as string),
      headline: props.headline as string ?? 'Weather Alert',
      description: props.description as string ?? '',
      instruction: props.instruction as string ?? undefined,
      affectedZones: (props.affectedZones as string[]) ?? [],
      issued: new Date(props.onset as string ?? Date.now()),
      expires: new Date(props.expires as string ?? Date.now()),
      source: props.senderName as string ?? 'NWS',
    };
  });
}

// ── Helper mappers ───────────────────────────────────────────

function mapNwsCondition(desc: string): WeatherCondition {
  const d = desc.toLowerCase();
  if (d.includes('tornado')) return WeatherCondition.Tornado;
  if (d.includes('hurricane')) return WeatherCondition.Hurricane;
  if (d.includes('severe') && d.includes('thunder')) return WeatherCondition.SevereThunderstorm;
  if (d.includes('thunder')) return WeatherCondition.Thunderstorm;
  if (d.includes('blizzard')) return WeatherCondition.Blizzard;
  if (d.includes('heavy snow')) return WeatherCondition.HeavySnow;
  if (d.includes('snow')) return WeatherCondition.Snow;
  if (d.includes('sleet') || d.includes('ice')) return WeatherCondition.Sleet;
  if (d.includes('freezing rain')) return WeatherCondition.FreezingRain;
  if (d.includes('heavy rain')) return WeatherCondition.HeavyRain;
  if (d.includes('rain') || d.includes('showers')) return WeatherCondition.Rain;
  if (d.includes('drizzle')) return WeatherCondition.Drizzle;
  if (d.includes('fog')) return WeatherCondition.Fog;
  if (d.includes('haze') || d.includes('hazy')) return WeatherCondition.Haze;
  if (d.includes('smoke')) return WeatherCondition.Smoke;
  if (d.includes('dust')) return WeatherCondition.Dust;
  if (d.includes('windy') || d.includes('breezy') || d.includes('gusty')) return WeatherCondition.Windy;
  if (d.includes('overcast')) return WeatherCondition.Overcast;
  if (d.includes('mostly cloudy') || d.includes('considerable cloud')) return WeatherCondition.MostlyCloudy;
  if (d.includes('partly cloudy') || d.includes('partly sunny')) return WeatherCondition.PartlyCloudy;
  if (d.includes('mostly sunny') || d.includes('mostly clear')) return WeatherCondition.PartlyCloudy;
  if (d.includes('sunny') || d.includes('clear') || d.includes('fair')) return WeatherCondition.Clear;
  if (d.includes('cloud')) return WeatherCondition.MostlyCloudy;
  return WeatherCondition.PartlyCloudy;
}

function mapCloudCover(desc: string): number {
  const d = desc.toLowerCase();
  if (d.includes('clear') || d.includes('sunny') || d.includes('fair')) return 10;
  if (d.includes('mostly sunny') || d.includes('mostly clear')) return 25;
  if (d.includes('partly')) return 50;
  if (d.includes('mostly cloudy')) return 75;
  if (d.includes('overcast') || d.includes('cloudy')) return 95;
  return 50;
}

function compassToDeg(compass: string): number {
  const map: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5,
    SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  };
  return map[compass] ?? 0;
}

function estimateUV(_lat: number, date: Date): number {
  const hour = date.getHours();
  if (hour < 6 || hour > 19) return 0;
  const solarNoon = Math.abs(hour - 13);
  const base = 8 - solarNoon * 1.2;
  return Math.max(0, Math.round(base));
}

function mapSeverity(s: string): AlertSeverity {
  switch (s?.toLowerCase()) {
    case 'extreme': return AlertSeverity.Extreme;
    case 'severe': return AlertSeverity.Severe;
    case 'moderate': return AlertSeverity.Moderate;
    default: return AlertSeverity.Minor;
  }
}

function mapUrgency(u: string): AlertUrgency {
  switch (u?.toLowerCase()) {
    case 'immediate': return AlertUrgency.Immediate;
    case 'expected': return AlertUrgency.Expected;
    case 'future': return AlertUrgency.Future;
    default: return AlertUrgency.Unknown;
  }
}

function mapCertainty(c: string): AlertCertainty {
  switch (c?.toLowerCase()) {
    case 'observed': return AlertCertainty.Observed;
    case 'likely': return AlertCertainty.Likely;
    case 'possible': return AlertCertainty.Possible;
    default: return AlertCertainty.Unknown;
  }
}
