/**
 * Model blending logic for AETHER forecast engine.
 *
 * Dynamically calculates per-model weights based on recent verification
 * accuracy, then produces a blended deterministic forecast with confidence
 * intervals derived from inter-model spread.
 */

export interface Location {
  lat: number;
  lon: number;
}

export interface ModelWeights {
  gfs: number;
  nam: number;
  hrrr: number;
  ecmwf: number;
}

export interface ModelForecast {
  modelId: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  precipProb: number;
  condition: string;
}

export interface BlendedForecast {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  precipProb: number;
  condition: string;
}

export interface ConfidenceResult {
  level: 'very_high' | 'high' | 'moderate' | 'low';
  spread: number;
  description: string;
}

/**
 * Calculate dynamic model weights for a given location and season.
 *
 * In production this would query the verification database for recent
 * model accuracy at nearby stations.  For now we use climatological
 * priors:
 *   - HRRR gets extra weight for short-range / convective seasons
 *   - ECMWF is favoured for medium-range / stable patterns
 *   - NAM is weighted more for CONUS mesoscale events
 *   - GFS provides the global baseline
 */
export function calculateModelWeights(
  location: Location,
  season: string,
): ModelWeights {
  // Base weights (sum to 1.0)
  const base: ModelWeights = {
    gfs: 0.20,
    nam: 0.20,
    hrrr: 0.30,
    ecmwf: 0.30,
  };

  // Season adjustments
  if (season === 'summer') {
    // Convective season favours high-res models
    base.hrrr += 0.10;
    base.ecmwf -= 0.05;
    base.gfs -= 0.05;
  } else if (season === 'winter') {
    // Synoptic patterns favour global models
    base.ecmwf += 0.10;
    base.hrrr -= 0.05;
    base.nam -= 0.05;
  }

  // Latitude adjustment: HRRR/NAM only cover CONUS
  const isCONUS = location.lat >= 24 && location.lat <= 50 && location.lon >= -125 && location.lon <= -66;
  if (!isCONUS) {
    // Redistribute NAM/HRRR weight to global models
    const redistributed = (base.nam + base.hrrr) / 2;
    base.gfs += redistributed;
    base.ecmwf += redistributed;
    base.nam = 0;
    base.hrrr = 0;
  }

  // Normalize so weights sum to 1.0
  const total = base.gfs + base.nam + base.hrrr + base.ecmwf;
  return {
    gfs: round(base.gfs / total),
    nam: round(base.nam / total),
    hrrr: round(base.hrrr / total),
    ecmwf: round(base.ecmwf / total),
  };
}

/**
 * Blend multiple model forecasts using the provided weight map.
 * Continuous variables are weight-averaged; categorical variables
 * use a majority-vote approach.
 */
export function blendForecasts(
  models: ModelForecast[],
  weights: ModelWeights,
): BlendedForecast {
  const weightMap = weights as Record<string, number>;
  let totalWeight = 0;
  let temp = 0;
  let feelsLike = 0;
  let humidity = 0;
  let windSpeed = 0;
  let windDirX = 0;
  let windDirY = 0;
  let precipProb = 0;
  const conditionVotes: Record<string, number> = {};

  for (const model of models) {
    const w = weightMap[model.modelId] ?? 0;
    if (w === 0) continue;

    totalWeight += w;
    temp += model.temp * w;
    feelsLike += model.feelsLike * w;
    humidity += model.humidity * w;
    windSpeed += model.windSpeed * w;
    precipProb += model.precipProb * w;

    // Vector average for wind direction
    const rad = (model.windDir * Math.PI) / 180;
    windDirX += Math.cos(rad) * w;
    windDirY += Math.sin(rad) * w;

    // Weighted vote for condition
    conditionVotes[model.condition] = (conditionVotes[model.condition] ?? 0) + w;
  }

  if (totalWeight === 0) {
    return {
      temp: 0,
      feelsLike: 0,
      humidity: 0,
      windSpeed: 0,
      windDir: 0,
      precipProb: 0,
      condition: 'unknown',
    };
  }

  // Determine winning condition
  const condition = Object.entries(conditionVotes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

  // Average wind direction from vector components
  const avgWindDir = ((Math.atan2(windDirY, windDirX) * 180) / Math.PI + 360) % 360;

  return {
    temp: Math.round(temp / totalWeight),
    feelsLike: Math.round(feelsLike / totalWeight),
    humidity: Math.round(humidity / totalWeight),
    windSpeed: Math.round(windSpeed / totalWeight),
    windDir: Math.round(avgWindDir),
    precipProb: Math.round(precipProb / totalWeight),
    condition,
  };
}

/**
 * Generate a confidence assessment from inter-model temperature spread.
 * Narrow spread implies models agree -> high confidence.
 */
export function generateConfidence(temps: number[]): ConfidenceResult {
  if (temps.length === 0) {
    return { level: 'low', spread: 0, description: 'No model data available' };
  }

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const spread = max - min;

  if (spread <= 2) {
    return { level: 'very_high', spread, description: 'Models in strong agreement' };
  }
  if (spread <= 5) {
    return { level: 'high', spread, description: 'Models mostly agree' };
  }
  if (spread <= 10) {
    return { level: 'moderate', spread, description: 'Some model disagreement' };
  }
  return { level: 'low', spread, description: 'Significant model divergence' };
}

function round(n: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
