// ============================================================
// AETHER Weather Wins Detection Engine
// Tracks and celebrates when forecasts help users make
// better decisions about their outdoor activities.
// ============================================================

import type {
  WeatherWinType,
  ActivityType,
  HourlyForecast,
  CurrentConditions,
  ForecastConfidence,
} from '@aether/shared';

// ── Types ───────────────────────────────────────────────────

export interface WeatherWin {
  id: string;
  userId: string;
  type: WeatherWinType;
  timestamp: Date;
  description: string;
  forecastRef?: string;
  magnitude: WinMagnitude;
  shared: boolean;
}

export type WinMagnitude = 'minor' | 'moderate' | 'major';

export interface ForecastSnapshot {
  time: Date;
  precipProb: number;
  precipAmount: number;
  temp: number;
  windSpeed: number;
  condition: string;
  confidence: ForecastConfidence;
}

export interface ActualConditions {
  time: Date;
  precipOccurred: boolean;
  precipAmount: number;
  temp: number;
  windSpeed: number;
  condition: string;
}

export interface ActivityScoreSnapshot {
  activity: ActivityType | string;
  score: number;
  windowStart: Date;
  windowEnd: Date;
}

export interface UserAction {
  type: 'stayed_in' | 'went_out' | 'changed_plans' | 'used_window';
  timestamp: Date;
  activityType?: ActivityType | string;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalWins: number;
  winsByType: Record<string, number>;
  streakDays: number;
  topWin: WeatherWin | null;
  narrative: string;
}

export interface AccuracyBucket {
  label: string;
  predicted: number;
  actual: number;
  count: number;
}

export interface AccuracyReport {
  period: { start: Date; end: Date };
  overallAccuracy: number;
  precipAccuracy: number;
  tempMeanAbsError: number;
  windMeanAbsError: number;
  buckets: AccuracyBucket[];
  sampleSize: number;
  narrative: string;
}

// ── Detection Functions ─────────────────────────────────────

/**
 * Detect if the user dodged rain by following the forecast.
 * Compares what was forecasted (high precip probability) against
 * actual conditions (rain did occur) to confirm the forecast was
 * correct and the user benefited from it.
 *
 * Returns a WeatherWin if rain was predicted AND occurred, meaning
 * the user was correctly warned. Returns null if no win detected.
 */
export function detectDodgedRain(
  forecast: ForecastSnapshot,
  actual: ActualConditions,
): WeatherWin | null {
  // Must have predicted meaningful rain probability
  if (forecast.precipProb < 40) return null;

  // Rain must have actually occurred
  if (!actual.precipOccurred) return null;

  // The closer the predicted prob is to 100% and the more it rained,
  // the bigger the win
  const magnitude = calculateRainDodgeMagnitude(forecast.precipProb, actual.precipAmount);

  const description = buildRainDodgeDescription(forecast, actual);

  return {
    id: generateWinId('dodged_rain', forecast.time),
    userId: '', // Populated by caller
    type: 'dodged_rain' as WeatherWinType,
    timestamp: actual.time,
    description,
    forecastRef: forecast.time.toISOString(),
    magnitude,
    shared: false,
  };
}

/**
 * Detect if the user found a good activity window based on the score.
 * Triggers when a user acts on a high-scoring activity window recommendation.
 *
 * Returns a WeatherWin if the score was high enough to be considered
 * a good find. Returns null otherwise.
 */
export function detectFoundWindow(
  activity: ActivityScoreSnapshot,
  score: number,
): WeatherWin | null {
  // Only count it as a win if the score was genuinely good
  if (score < 70) return null;

  const magnitude: WinMagnitude =
    score >= 90 ? 'major' : score >= 80 ? 'moderate' : 'minor';

  const label =
    score >= 90 ? 'perfect' : score >= 80 ? 'great' : 'good';

  const durationHours = Math.round(
    (activity.windowEnd.getTime() - activity.windowStart.getTime()) / 3600000,
  );

  const description =
    `Found a ${label} ${durationHours}-hour window for ${activity.activity} ` +
    `(score: ${score}/100)`;

  return {
    id: generateWinId('found_window', activity.windowStart),
    userId: '',
    type: 'found_window' as WeatherWinType,
    timestamp: activity.windowStart,
    description,
    magnitude,
    shared: false,
  };
}

/**
 * Detect if the user avoided an extreme weather event by changing plans.
 * Compares actual dangerous conditions against the user's action of
 * staying in or changing plans.
 *
 * Returns a WeatherWin if extreme conditions occurred and user
 * took protective action. Returns null otherwise.
 */
export function detectAvoidedExtreme(
  conditions: ActualConditions,
  userAction: UserAction,
): WeatherWin | null {
  // User must have taken a protective action
  if (userAction.type !== 'stayed_in' && userAction.type !== 'changed_plans') {
    return null;
  }

  // Check if conditions were actually extreme
  const extremeFactors: string[] = [];

  if (conditions.temp > 105) extremeFactors.push(`dangerous heat (${conditions.temp}F)`);
  if (conditions.temp < 0) extremeFactors.push(`dangerous cold (${conditions.temp}F)`);
  if (conditions.windSpeed > 50) extremeFactors.push(`severe winds (${conditions.windSpeed} mph)`);
  if (conditions.precipAmount > 1.0) extremeFactors.push(`heavy precipitation (${conditions.precipAmount}")`);

  const severeConditions = ['thunderstorm', 'severe_thunderstorm', 'tornado', 'hurricane', 'blizzard'];
  if (severeConditions.includes(conditions.condition)) {
    extremeFactors.push(conditions.condition.replace(/_/g, ' '));
  }

  // No extreme conditions detected
  if (extremeFactors.length === 0) return null;

  const magnitude: WinMagnitude =
    extremeFactors.length >= 3 ? 'major' : extremeFactors.length >= 2 ? 'moderate' : 'minor';

  const actionVerb = userAction.type === 'stayed_in' ? 'Stayed in' : 'Changed plans';
  const description =
    `${actionVerb} and avoided ${extremeFactors.join(', ')}`;

  return {
    id: generateWinId('avoided_extreme', conditions.time),
    userId: '',
    type: 'avoided_extreme' as WeatherWinType,
    timestamp: conditions.time,
    description,
    magnitude,
    shared: false,
  };
}

/**
 * Calculate a weekly summary of weather wins.
 * Aggregates wins by type, finds the top win, calculates streaks,
 * and generates a narrative for the weekly recap notification.
 */
export function calculateWeeklyWins(wins: WeatherWin[]): WeeklySummary {
  if (wins.length === 0) {
    const now = new Date();
    return {
      weekStart: getWeekStart(now),
      weekEnd: getWeekEnd(now),
      totalWins: 0,
      winsByType: {},
      streakDays: 0,
      topWin: null,
      narrative: 'No weather wins this week. Better luck next week!',
    };
  }

  // Sort wins chronologically
  const sorted = [...wins].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const weekStart = getWeekStart(sorted[0]!.timestamp);
  const weekEnd = getWeekEnd(sorted[0]!.timestamp);

  // Count by type
  const winsByType: Record<string, number> = {};
  for (const win of sorted) {
    winsByType[win.type] = (winsByType[win.type] ?? 0) + 1;
  }

  // Find top win (prefer major magnitude, then most recent)
  const magnitudeOrder: Record<WinMagnitude, number> = {
    major: 3,
    moderate: 2,
    minor: 1,
  };
  const topWin = [...sorted].sort(
    (a, b) => magnitudeOrder[b.magnitude] - magnitudeOrder[a.magnitude],
  )[0]!;

  // Calculate streak: consecutive days with at least one win
  const uniqueDays = new Set(
    sorted.map((w) => w.timestamp.toISOString().split('T')[0]),
  );
  const streakDays = calculateConsecutiveDays(uniqueDays);

  // Build narrative
  const narrative = buildWeeklyNarrative(sorted.length, winsByType, topWin, streakDays);

  return {
    weekStart,
    weekEnd,
    totalWins: sorted.length,
    winsByType,
    streakDays,
    topWin,
    narrative,
  };
}

/**
 * Calculate forecast accuracy by comparing predicted conditions
 * against actual observations over a period.
 *
 * Returns an AccuracyReport with overall percentage, per-metric
 * error rates, and calibration buckets for precipitation probability.
 */
export function calculateAccuracy(
  predictions: ForecastSnapshot[],
  actuals: ActualConditions[],
): AccuracyReport {
  if (predictions.length === 0 || actuals.length === 0) {
    const now = new Date();
    return {
      period: { start: now, end: now },
      overallAccuracy: 0,
      precipAccuracy: 0,
      tempMeanAbsError: 0,
      windMeanAbsError: 0,
      buckets: [],
      sampleSize: 0,
      narrative: 'Insufficient data for accuracy calculation.',
    };
  }

  // Match predictions to actuals by closest timestamp
  const pairs = matchPredictionsToActuals(predictions, actuals);

  if (pairs.length === 0) {
    return {
      period: {
        start: predictions[0]!.time,
        end: predictions[predictions.length - 1]!.time,
      },
      overallAccuracy: 0,
      precipAccuracy: 0,
      tempMeanAbsError: 0,
      windMeanAbsError: 0,
      buckets: [],
      sampleSize: 0,
      narrative: 'No matching prediction/actual pairs found.',
    };
  }

  // Precipitation accuracy: did we correctly predict rain/no-rain?
  let precipCorrect = 0;
  let tempAbsErrorSum = 0;
  let windAbsErrorSum = 0;

  // Calibration buckets for precip probability
  const bucketRanges = [
    { label: '0-20%', min: 0, max: 20 },
    { label: '20-40%', min: 20, max: 40 },
    { label: '40-60%', min: 40, max: 60 },
    { label: '60-80%', min: 60, max: 80 },
    { label: '80-100%', min: 80, max: 100 },
  ];
  const bucketData = bucketRanges.map((b) => ({
    ...b,
    predictedSum: 0,
    actualSum: 0,
    count: 0,
  }));

  for (const { prediction, actual } of pairs) {
    // Precip: threshold at 50% probability
    const predictedRain = prediction.precipProb >= 50;
    if (predictedRain === actual.precipOccurred) precipCorrect++;

    // Temp MAE
    tempAbsErrorSum += Math.abs(prediction.temp - actual.temp);

    // Wind MAE
    windAbsErrorSum += Math.abs(prediction.windSpeed - actual.windSpeed);

    // Calibration buckets
    for (const bucket of bucketData) {
      if (prediction.precipProb >= bucket.min && prediction.precipProb < bucket.max) {
        bucket.predictedSum += prediction.precipProb;
        bucket.actualSum += actual.precipOccurred ? 100 : 0;
        bucket.count++;
        break;
      }
    }
  }

  const precipAccuracy = (precipCorrect / pairs.length) * 100;
  const tempMeanAbsError = tempAbsErrorSum / pairs.length;
  const windMeanAbsError = windAbsErrorSum / pairs.length;

  // Overall accuracy: weighted combination
  const tempScore = Math.max(0, 100 - tempMeanAbsError * 5);
  const windScore = Math.max(0, 100 - windMeanAbsError * 3);
  const overallAccuracy = Math.round(
    precipAccuracy * 0.4 + tempScore * 0.35 + windScore * 0.25,
  );

  const buckets: AccuracyBucket[] = bucketData
    .filter((b) => b.count > 0)
    .map((b) => ({
      label: b.label,
      predicted: Math.round(b.predictedSum / b.count),
      actual: Math.round(b.actualSum / b.count),
      count: b.count,
    }));

  const period = {
    start: pairs[0]!.prediction.time,
    end: pairs[pairs.length - 1]!.prediction.time,
  };

  const narrative = buildAccuracyNarrative(
    overallAccuracy,
    precipAccuracy,
    tempMeanAbsError,
    windMeanAbsError,
    pairs.length,
  );

  return {
    period,
    overallAccuracy,
    precipAccuracy: Math.round(precipAccuracy),
    tempMeanAbsError: Math.round(tempMeanAbsError * 10) / 10,
    windMeanAbsError: Math.round(windMeanAbsError * 10) / 10,
    buckets,
    sampleSize: pairs.length,
    narrative,
  };
}

// ── Internal Helpers ────────────────────────────────────────

function generateWinId(type: string, time: Date): string {
  const ts = time.getTime().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `win_${type}_${ts}_${rand}`;
}

function calculateRainDodgeMagnitude(
  precipProb: number,
  actualAmount: number,
): WinMagnitude {
  if (precipProb >= 80 && actualAmount >= 0.5) return 'major';
  if (precipProb >= 60 && actualAmount >= 0.25) return 'moderate';
  return 'minor';
}

function buildRainDodgeDescription(
  forecast: ForecastSnapshot,
  actual: ActualConditions,
): string {
  const amount = actual.precipAmount.toFixed(2);
  return (
    `Dodged ${amount}" of rain! Forecast predicted ${forecast.precipProb}% chance ` +
    `and it delivered. Good call staying dry.`
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function calculateConsecutiveDays(dayStrings: Set<string>): number {
  if (dayStrings.size === 0) return 0;

  const sorted = [...dayStrings].sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (Math.abs(diffDays - 1) < 0.01) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

function buildWeeklyNarrative(
  totalWins: number,
  winsByType: Record<string, number>,
  topWin: WeatherWin,
  streakDays: number,
): string {
  const parts: string[] = [];

  if (totalWins === 1) {
    parts.push('You had 1 weather win this week.');
  } else {
    parts.push(`You had ${totalWins} weather wins this week!`);
  }

  if (streakDays >= 3) {
    parts.push(`${streakDays}-day winning streak!`);
  }

  if (topWin.magnitude === 'major') {
    parts.push(`Highlight: ${topWin.description}`);
  }

  const dodged = winsByType['dodged_rain'] ?? 0;
  if (dodged > 0) {
    parts.push(`You dodged rain ${dodged} time${dodged > 1 ? 's' : ''}.`);
  }

  return parts.join(' ');
}

function buildAccuracyNarrative(
  overall: number,
  precipAcc: number,
  tempMAE: number,
  windMAE: number,
  sampleSize: number,
): string {
  const grade =
    overall >= 90
      ? 'Excellent'
      : overall >= 75
        ? 'Good'
        : overall >= 60
          ? 'Fair'
          : 'Needs improvement';

  return (
    `${grade} forecast accuracy (${overall}%) based on ${sampleSize} data points. ` +
    `Rain predictions were ${precipAcc}% accurate. ` +
    `Temperature was off by ${tempMAE}F on average, wind by ${windMAE} mph.`
  );
}

interface PredictionActualPair {
  prediction: ForecastSnapshot;
  actual: ActualConditions;
}

function matchPredictionsToActuals(
  predictions: ForecastSnapshot[],
  actuals: ActualConditions[],
): PredictionActualPair[] {
  const MAX_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
  const pairs: PredictionActualPair[] = [];
  const usedActuals = new Set<number>();

  for (const prediction of predictions) {
    let bestIdx = -1;
    let bestDiff = Infinity;

    for (let i = 0; i < actuals.length; i++) {
      if (usedActuals.has(i)) continue;
      const diff = Math.abs(prediction.time.getTime() - actuals[i]!.time.getTime());
      if (diff < bestDiff && diff <= MAX_MATCH_WINDOW_MS) {
        bestDiff = diff;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      pairs.push({ prediction, actual: actuals[bestIdx]! });
      usedActuals.add(bestIdx);
    }
  }

  return pairs.sort(
    (a, b) => a.prediction.time.getTime() - b.prediction.time.getTime(),
  );
}
