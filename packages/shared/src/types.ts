// ============================================================
// AETHER Core Type Definitions
// ============================================================

import type {
  SubscriptionTier,
  TempUnit,
  WindUnit,
  PressureUnit,
  PrecipUnit,
  DistanceUnit,
  NotificationTone,
  Theme,
  WeatherCondition,
  PrecipType,
  AlertSeverity,
  AlertUrgency,
  AlertCertainty,
  ForecastModel,
  ForecastConfidence,
  ActivityType,
  NotificationType,
  CommuteMode,
  DevicePlatform,
  CrowdsourceCondition,
  ReputationBadge,
  WeatherWinType,
  AqiCategory,
  RadarProduct,
} from './enums';

// ── Geo ──────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Location extends Coordinates {
  name: string;
  nickname?: string;
  timezone: string;
  elevationFt?: number;
  h3Index?: string; // H3 resolution 7
}

export interface SavedLocation extends Location {
  id: string;
  userId: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

// ── User ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name?: string;
  tier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  units: UnitPreferences;
  tone: NotificationTone;
  theme: Theme;
  reducedMotion: boolean;
  simpleMode: boolean;
  language: string;
  timezone: string;
}

export interface UnitPreferences {
  temp: TempUnit;
  wind: WindUnit;
  pressure: PressureUnit;
  precip: PrecipUnit;
  distance: DistanceUnit;
}

export interface NotificationSettings {
  userId: string;
  type: NotificationType;
  enabled: boolean;
  quietStart?: string; // HH:mm
  quietEnd?: string;
  toneOverride?: NotificationTone;
}

export interface Device {
  id: string;
  userId: string;
  platform: DevicePlatform;
  pushToken?: string;
  lastActive: Date;
}

// ── Weather ──────────────────────────────────────────────────

export interface CurrentConditions {
  location: Coordinates;
  observedAt: Date;
  temp: number; // Always stored as Fahrenheit
  feelsLike: number;
  humidity: number; // 0-100
  dewpoint: number;
  pressure: number; // mb
  pressureTrend: 'rising' | 'steady' | 'falling';
  windSpeed: number; // mph
  windDir: number; // degrees
  windGust?: number;
  visibility: number; // miles
  cloudCover: number; // 0-100
  condition: WeatherCondition;
  precipRate?: number; // in/hr
  precipType: PrecipType;
  uvIndex: number;
  aqi?: AqiReading;
}

export interface HourlyForecast {
  time: Date;
  temp: number;
  feelsLike: number;
  humidity: number;
  dewpoint: number;
  pressure: number;
  windSpeed: number;
  windDir: number;
  windGust?: number;
  cloudCover: number;
  condition: WeatherCondition;
  precipProb: number; // 0-100
  precipAmount: number; // inches
  precipType: PrecipType;
  uvIndex: number;
  visibility: number;
  confidence: ForecastConfidence;
}

export interface DailyForecast {
  date: Date;
  tempHigh: number;
  tempLow: number;
  feelsLikeHigh: number;
  feelsLikeLow: number;
  humidity: number;
  condition: WeatherCondition;
  conditionNight: WeatherCondition;
  precipProb: number;
  precipAmount: number;
  precipType: PrecipType;
  windSpeed: number;
  windGust?: number;
  windDir: number;
  uvIndexMax: number;
  sunrise: Date;
  sunset: Date;
  moonrise?: Date;
  moonset?: Date;
  moonPhase: number; // 0-1
  goldenHourMorning: { start: Date; end: Date };
  goldenHourEvening: { start: Date; end: Date };
  narrative: string;
  confidence: ForecastConfidence;
}

export interface MinuteForecast {
  time: Date;
  precipProb: number;
  precipIntensity: number; // in/hr
  precipType: PrecipType;
}

export interface ForecastResponse {
  location: Location;
  current: CurrentConditions;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  minutely?: MinuteForecast[];
  model: ForecastModel;
  generatedAt: Date;
  actionLine: string;
}

// ── Alerts ───────────────────────────────────────────────────

export interface WeatherAlert {
  id: string;
  type: string; // NWS event type
  severity: AlertSeverity;
  urgency: AlertUrgency;
  certainty: AlertCertainty;
  headline: string;
  description: string;
  instruction?: string;
  areaPolygon?: { type: 'Polygon'; coordinates: number[][][] };
  affectedZones: string[];
  issued: Date;
  expires: Date;
  source: string;
}

// ── Air Quality ──────────────────────────────────────────────

export interface AqiReading {
  aqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
  source: string;
  observedAt: Date;
}

export interface PollenReading {
  treeTotal: number;
  grassTotal: number;
  weedTotal: number;
  moldTotal: number;
  dominantSpecies?: string;
  observedAt: Date;
}

// ── Radar ────────────────────────────────────────────────────

export interface RadarFrame {
  timestamp: Date;
  tileUrlTemplate: string; // /v1/radar/tiles/{z}/{x}/{y}?t={timestamp}
  product: RadarProduct;
}

export interface RadarAnimation {
  frames: RadarFrame[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  intervalMs: number;
}

// ── Activity Scoring ─────────────────────────────────────────

export interface ActivityScore {
  activity: ActivityType;
  score: number; // 0-100
  label: 'Perfect' | 'Great' | 'Good' | 'Fair' | 'Poor' | 'Bad';
  factors: ActivityFactor[];
  window?: { start: Date; end: Date; durationHours: number };
}

export interface ActivityFactor {
  name: string;
  value: number | string;
  impact: 'positive' | 'neutral' | 'negative' | 'dealbreaker';
  detail: string;
}

export interface ActivityWindow {
  activity: ActivityType;
  start: Date;
  end: Date;
  score: number;
  confidence: ForecastConfidence;
}

// ── Crowdsource ──────────────────────────────────────────────

export interface CrowdsourceReport {
  id: string;
  userId: string;
  location: Coordinates;
  condition: CrowdsourceCondition;
  photoUrl?: string;
  description?: string;
  timestamp: Date;
  verified: boolean;
}

export interface UserReputation {
  userId: string;
  score: number;
  badges: ReputationBadge[];
  verifiedCount: number;
  lastReport?: Date;
}

// ── Weather Wins ─────────────────────────────────────────────

export interface WeatherWin {
  id: string;
  userId: string;
  type: WeatherWinType;
  timestamp: Date;
  description: string;
  forecastRef?: string;
  shared: boolean;
}

// ── Commute ──────────────────────────────────────────────────

export interface CommuteRoute {
  id: string;
  userId: string;
  name: string;
  origin: Coordinates;
  destination: Coordinates;
  mode: CommuteMode;
  departureTime: string; // HH:mm
}

// ── Health ────────────────────────────────────────────────────

export interface HealthProfile {
  userId: string;
  migraineSensitivity: number; // 1-10
  arthritisThreshold: number; // 1-10
  pollenTriggers: string[];
  aqiThreshold: number;
  conditions: string[];
}

// ── Historical ───────────────────────────────────────────────

export interface HistoricalDay {
  date: Date;
  location: Coordinates;
  tempHigh: number;
  tempLow: number;
  precip: number;
  snowfall?: number;
  condition: WeatherCondition;
  windSpeed: number;
  source: string;
}

export interface ClimateNormals {
  location: Coordinates;
  month: number;
  tempHighAvg: number;
  tempLowAvg: number;
  precipAvg: number;
  snowAvg?: number;
  recordHigh: { value: number; year: number };
  recordLow: { value: number; year: number };
}

// ── Webhooks ─────────────────────────────────────────────────

export interface WebhookSubscription {
  id: string;
  userId: string;
  location: Coordinates;
  conditionType: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  callbackUrl: string;
  active: boolean;
}

// ── API ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta: {
    generatedAt: string;
    model?: ForecastModel;
    confidence?: ForecastConfidence;
    cached: boolean;
  };
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
