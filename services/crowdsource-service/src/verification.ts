/**
 * Crowd-sourced report verification for AETHER.
 *
 * Cross-validates user-submitted weather observations against radar data
 * and nearby reports to assign a confidence score and detect bad-faith
 * submissions.  Also manages user reputation badges.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportInput {
  condition: string;
  temp?: number;
  lat: number;
  lon: number;
}

export interface NearbyReport {
  condition: string;
  temp?: number;
}

export interface RadarSnapshot {
  reflectivity: number; // dBZ
  precipType: 'none' | 'rain' | 'snow' | 'mix';
  timestamp: string;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number; // 0..1
  flags: string[];
  radarMatch: boolean | null;
  neighborAgreement: number; // 0..1
}

export type ReputationBadge =
  | 'new_observer'
  | 'trusted_observer'
  | 'verified_spotter'
  | 'storm_chaser'
  | 'community_expert';

export interface ReputationResult {
  badge: ReputationBadge;
  level: number; // 1-5
  verifiedRatio: number;
  totalReports: number;
}

export interface UserInfo {
  id: string;
  totalReports: number;
}

// ---------------------------------------------------------------------------
// Report verification
// ---------------------------------------------------------------------------

/**
 * Verify a crowd-sourced weather report against radar data and nearby
 * user reports.
 *
 * Confidence is a weighted combination of:
 *   - Radar agreement  (40%)
 *   - Nearby report agreement (40%)
 *   - Internal consistency (20%)
 */
export function verifyReport(
  report: ReportInput,
  radarData: RadarSnapshot | null,
  nearbyReports: NearbyReport[],
): VerificationResult {
  const flags: string[] = [];
  let score = 0;
  let radarMatch: boolean | null = null;

  // --- Radar cross-validation ---
  if (radarData) {
    radarMatch = crossValidateWithRadar(report, radarData);
    score += radarMatch ? 0.4 : 0;
    if (!radarMatch) {
      flags.push('radar_mismatch');
    }
  } else {
    // No radar data available; give partial credit
    score += 0.2;
    flags.push('no_radar_data');
  }

  // --- Nearby report agreement ---
  const neighborAgreement = calculateNeighborAgreement(report, nearbyReports);
  score += neighborAgreement * 0.4;
  if (nearbyReports.length === 0) {
    flags.push('no_nearby_reports');
  } else if (neighborAgreement < 0.3) {
    flags.push('low_neighbor_agreement');
  }

  // --- Internal consistency ---
  const consistency = checkInternalConsistency(report);
  score += consistency * 0.2;
  if (consistency < 0.5) {
    flags.push('internal_inconsistency');
  }

  return {
    verified: score >= 0.5,
    confidence: Math.round(score * 100) / 100,
    flags,
    radarMatch,
    neighborAgreement: Math.round(neighborAgreement * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Reputation
// ---------------------------------------------------------------------------

/**
 * Calculate a user's reputation badge based on their submission history
 * and verification rate.
 */
export function calculateReputation(
  user: UserInfo,
  verifiedCount: number,
): ReputationResult {
  const ratio = user.totalReports > 0 ? verifiedCount / user.totalReports : 0;

  let badge: ReputationBadge;
  let level: number;

  if (user.totalReports < 5) {
    badge = 'new_observer';
    level = 1;
  } else if (user.totalReports < 25 || ratio < 0.6) {
    badge = 'trusted_observer';
    level = 2;
  } else if (user.totalReports < 100 || ratio < 0.75) {
    badge = 'verified_spotter';
    level = 3;
  } else if (user.totalReports < 500 || ratio < 0.85) {
    badge = 'storm_chaser';
    level = 4;
  } else {
    badge = 'community_expert';
    level = 5;
  }

  return {
    badge,
    level,
    verifiedRatio: Math.round(ratio * 100) / 100,
    totalReports: user.totalReports,
  };
}

// ---------------------------------------------------------------------------
// Radar cross-validation
// ---------------------------------------------------------------------------

/**
 * Check whether a user report is consistent with radar observations.
 * Precipitation reports should match radar reflectivity; clear-sky
 * reports should correspond to low reflectivity.
 */
export function crossValidateWithRadar(
  report: ReportInput,
  radar: RadarSnapshot,
): boolean {
  const precipConditions = [
    'rain_light',
    'rain_heavy',
    'thunderstorm',
    'snow_light',
    'snow_heavy',
    'ice',
    'hail',
  ];

  const reportHasPrecip = precipConditions.includes(report.condition);

  // Reflectivity > 20 dBZ generally indicates precipitation
  const radarHasPrecip = radar.reflectivity > 20;

  // Simple agreement check
  if (reportHasPrecip && radarHasPrecip) return true;
  if (!reportHasPrecip && !radarHasPrecip) return true;

  // Fog is an exception -- radar may not detect it
  if (report.condition === 'fog' && !radarHasPrecip) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function calculateNeighborAgreement(
  report: ReportInput,
  nearby: NearbyReport[],
): number {
  if (nearby.length === 0) return 0.5; // neutral when no data

  let matches = 0;
  for (const neighbor of nearby) {
    if (conditionsMatch(report.condition, neighbor.condition)) {
      matches++;
    }
  }

  return matches / nearby.length;
}

function conditionsMatch(a: string, b: string): boolean {
  if (a === b) return true;

  // Group similar conditions
  const groups: string[][] = [
    ['clear', 'partly_cloudy'],
    ['rain_light', 'rain_heavy'],
    ['snow_light', 'snow_heavy'],
    ['thunderstorm', 'rain_heavy', 'hail'],
  ];

  return groups.some((group) => group.includes(a) && group.includes(b));
}

function checkInternalConsistency(report: ReportInput): number {
  let score = 1.0;

  // Snow with high temperature is suspicious
  if (
    (report.condition === 'snow_light' || report.condition === 'snow_heavy') &&
    report.temp !== undefined &&
    report.temp > 40
  ) {
    score -= 0.5;
  }

  // Ice with very high temperature
  if (report.condition === 'ice' && report.temp !== undefined && report.temp > 35) {
    score -= 0.5;
  }

  return Math.max(0, score);
}
