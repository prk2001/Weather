// ============================================================
// Activity Scoring Framework
// Score 0-100 based on weather conditions for each activity
// ============================================================

import type { ActivityType, HourlyForecast, ActivityScore, ActivityFactor } from '@aether/shared';

interface ActivityProfile {
  type: ActivityType;
  name: string;
  optimalTemp: [number, number]; // [min, max] °F
  okTemp: [number, number];
  maxWind: number; // mph
  maxPrecipProb: number; // 0-100
  maxUV?: number;
  minVisibility?: number; // miles
  maxHumidity?: number;
  customFactors?: (forecast: HourlyForecast) => ActivityFactor[];
}

const PROFILES: Record<string, ActivityProfile> = {
  running: {
    type: 'running' as ActivityType,
    name: 'Running',
    optimalTemp: [45, 65],
    okTemp: [30, 85],
    maxWind: 25,
    maxPrecipProb: 30,
    maxHumidity: 80,
  },
  cycling: {
    type: 'cycling' as ActivityType,
    name: 'Cycling',
    optimalTemp: [55, 75],
    okTemp: [40, 90],
    maxWind: 20,
    maxPrecipProb: 15,
    maxHumidity: 85,
  },
  hiking: {
    type: 'hiking' as ActivityType,
    name: 'Hiking',
    optimalTemp: [50, 75],
    okTemp: [30, 90],
    maxWind: 30,
    maxPrecipProb: 25,
    maxUV: 10,
    minVisibility: 3,
  },
  stargazing: {
    type: 'stargazing' as ActivityType,
    name: 'Stargazing',
    optimalTemp: [40, 75],
    okTemp: [20, 85],
    maxWind: 15,
    maxPrecipProb: 5,
    minVisibility: 10,
  },
  photography: {
    type: 'photography' as ActivityType,
    name: 'Photography',
    optimalTemp: [40, 80],
    okTemp: [20, 95],
    maxWind: 20,
    maxPrecipProb: 20,
    minVisibility: 5,
  },
  grilling: {
    type: 'grilling' as ActivityType,
    name: 'Grilling/BBQ',
    optimalTemp: [65, 85],
    okTemp: [50, 95],
    maxWind: 20,
    maxPrecipProb: 15,
  },
  gardening: {
    type: 'gardening' as ActivityType,
    name: 'Gardening',
    optimalTemp: [55, 80],
    okTemp: [40, 90],
    maxWind: 20,
    maxPrecipProb: 30,
    maxUV: 8,
  },
  fishing: {
    type: 'fishing' as ActivityType,
    name: 'Fishing',
    optimalTemp: [55, 80],
    okTemp: [35, 90],
    maxWind: 15,
    maxPrecipProb: 40,
  },
  golf: {
    type: 'golf' as ActivityType,
    name: 'Golf',
    optimalTemp: [60, 80],
    okTemp: [45, 90],
    maxWind: 20,
    maxPrecipProb: 15,
    maxHumidity: 85,
  },
  dog_walking: {
    type: 'dog_walking' as ActivityType,
    name: 'Dog Walking',
    optimalTemp: [45, 75],
    okTemp: [25, 85],
    maxWind: 25,
    maxPrecipProb: 40,
  },
  wedding: {
    type: 'wedding' as ActivityType,
    name: 'Outdoor Wedding',
    optimalTemp: [65, 80],
    okTemp: [55, 85],
    maxWind: 15,
    maxPrecipProb: 10,
    maxHumidity: 70,
    maxUV: 8,
  },
  snow_sports: {
    type: 'snow_sports' as ActivityType,
    name: 'Snow Sports',
    optimalTemp: [15, 32],
    okTemp: [-10, 38],
    maxWind: 25,
    maxPrecipProb: 100, // Snow is fine!
    minVisibility: 1,
  },
  surfing: {
    type: 'surfing' as ActivityType,
    name: 'Surfing',
    optimalTemp: [60, 85],
    okTemp: [45, 95],
    maxWind: 25,
    maxPrecipProb: 70, // Rain doesn't matter when wet
  },
};

export function getActivityProfile(type: string): ActivityProfile | undefined {
  return PROFILES[type];
}

export function scoreActivity(type: string, forecast: HourlyForecast): ActivityScore {
  const profile = PROFILES[type];
  if (!profile) {
    return {
      activity: type as ActivityType,
      score: 50,
      label: 'Fair',
      factors: [{ name: 'Unknown', value: 'N/A', impact: 'neutral', detail: 'No profile found' }],
    };
  }

  const factors: ActivityFactor[] = [];
  let score = 100;

  // Temperature scoring
  const temp = forecast.temp;
  if (temp >= profile.optimalTemp[0] && temp <= profile.optimalTemp[1]) {
    factors.push({ name: 'Temperature', value: `${temp}°F`, impact: 'positive', detail: 'Ideal range' });
  } else if (temp >= profile.okTemp[0] && temp <= profile.okTemp[1]) {
    const penalty = temp < profile.optimalTemp[0]
      ? (profile.optimalTemp[0] - temp) * 1.5
      : (temp - profile.optimalTemp[1]) * 1.5;
    score -= penalty;
    factors.push({ name: 'Temperature', value: `${temp}°F`, impact: 'neutral', detail: 'Acceptable' });
  } else {
    score -= 40;
    factors.push({ name: 'Temperature', value: `${temp}°F`, impact: 'dealbreaker', detail: 'Outside safe range' });
  }

  // Wind scoring
  if (forecast.windSpeed <= profile.maxWind * 0.5) {
    factors.push({ name: 'Wind', value: `${forecast.windSpeed} mph`, impact: 'positive', detail: 'Light winds' });
  } else if (forecast.windSpeed <= profile.maxWind) {
    score -= (forecast.windSpeed / profile.maxWind) * 15;
    factors.push({ name: 'Wind', value: `${forecast.windSpeed} mph`, impact: 'neutral', detail: 'Manageable' });
  } else {
    score -= 30;
    factors.push({ name: 'Wind', value: `${forecast.windSpeed} mph`, impact: 'dealbreaker', detail: 'Too windy' });
  }

  // Precipitation scoring
  if (forecast.precipProb <= 10) {
    factors.push({ name: 'Rain chance', value: `${forecast.precipProb}%`, impact: 'positive', detail: 'Dry' });
  } else if (forecast.precipProb <= profile.maxPrecipProb) {
    score -= (forecast.precipProb / 100) * 20;
    factors.push({ name: 'Rain chance', value: `${forecast.precipProb}%`, impact: 'neutral', detail: 'Some risk' });
  } else {
    score -= 35;
    factors.push({ name: 'Rain chance', value: `${forecast.precipProb}%`, impact: 'dealbreaker', detail: 'Likely wet' });
  }

  // UV scoring
  if (profile.maxUV && forecast.uvIndex > profile.maxUV) {
    score -= 15;
    factors.push({ name: 'UV Index', value: `${forecast.uvIndex}`, impact: 'negative', detail: 'High UV exposure' });
  }

  // Humidity scoring
  if (profile.maxHumidity && forecast.humidity > profile.maxHumidity) {
    score -= 15;
    factors.push({ name: 'Humidity', value: `${forecast.humidity}%`, impact: 'negative', detail: 'Very humid' });
  }

  // Visibility scoring
  if (profile.minVisibility && forecast.visibility < profile.minVisibility) {
    score -= 20;
    factors.push({ name: 'Visibility', value: `${forecast.visibility} mi`, impact: 'negative', detail: 'Low visibility' });
  }

  // Cloud cover bonus for stargazing
  if (type === 'stargazing' && forecast.cloudCover > 50) {
    score -= forecast.cloudCover * 0.5;
    factors.push({ name: 'Cloud cover', value: `${forecast.cloudCover}%`, impact: 'dealbreaker', detail: 'Clouds block sky' });
  }

  // Custom factors
  if (profile.customFactors) {
    factors.push(...profile.customFactors(forecast));
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    activity: profile.type,
    score: finalScore,
    label: scoreLabel(finalScore),
    factors,
  };
}

function scoreLabel(score: number): ActivityScore['label'] {
  if (score >= 90) return 'Perfect';
  if (score >= 75) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Bad';
}

export function findBestWindows(
  type: string,
  hourlyForecasts: HourlyForecast[],
  windowHours = 2,
  topN = 3,
): ActivityScore[] {
  const windows: ActivityScore[] = [];

  for (let i = 0; i <= hourlyForecasts.length - windowHours; i++) {
    const windowForecasts = hourlyForecasts.slice(i, i + windowHours);
    const avgScore =
      windowForecasts.reduce((sum, f) => sum + scoreActivity(type, f).score, 0) / windowHours;

    const firstForecast = windowForecasts[0]!;
    const lastForecast = windowForecasts[windowHours - 1]!;
    const scored = scoreActivity(type, firstForecast);

    windows.push({
      ...scored,
      score: Math.round(avgScore),
      label: scoreLabel(Math.round(avgScore)),
      window: {
        start: firstForecast.time,
        end: new Date(lastForecast.time.getTime() + 3600000),
        durationHours: windowHours,
      },
    });
  }

  return windows.sort((a, b) => b.score - a.score).slice(0, topN);
}
