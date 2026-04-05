// ============================================================
// AETHER Constants
// ============================================================

// ── Colors (Adaptive Theme Palettes) ─────────────────────────

export const SEVERITY_COLORS = {
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  red: '#EF4444',
  purple: '#A855F7',
} as const;

export const THEME_COLORS = {
  day_clear: {
    bg: '#87CEEB',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    accent: '#F59E0B',
  },
  day_overcast: {
    bg: '#B0BEC5',
    surface: '#ECEFF1',
    text: '#263238',
    accent: '#78909C',
  },
  day_rain: {
    bg: '#546E7A',
    surface: '#CFD8DC',
    text: '#1A1A2E',
    accent: '#42A5F5',
  },
  night_clear: {
    bg: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    accent: '#818CF8',
  },
  night_cloudy: {
    bg: '#1E293B',
    surface: '#334155',
    text: '#E2E8F0',
    accent: '#64748B',
  },
  severe: {
    bg: '#1A0000',
    surface: '#2D0A0A',
    text: '#FEF2F2',
    accent: '#EF4444',
  },
  snow: {
    bg: '#EFF6FF',
    surface: '#FFFFFF',
    text: '#1E3A5F',
    accent: '#3B82F6',
  },
} as const;

// ── Typography ───────────────────────────────────────────────

export const FONT_FAMILY = "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const FONT_SIZES = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  temp: '6rem',     // 96px — main temperature display
} as const;

// ── Spacing (4px base grid) ──────────────────────────────────

export const SPACING = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
} as const;

// ── Rate Limits ──────────────────────────────────────────────

export const RATE_LIMITS = {
  free: { daily: 100, perMinute: 10 },
  pro: { daily: 5000, perMinute: 60 },
  premium: { daily: 50000, perMinute: 120 },
  enterprise: { daily: Infinity, perMinute: 600 },
} as const;

// ── Feature Limits ───────────────────────────────────────────

export const FEATURE_LIMITS = {
  free: {
    hourlyForecastHours: 24,
    dailyForecastDays: 7,
    savedLocations: 1,
    activityProfiles: 3,
    nlqPerDay: 3,
  },
  pro: {
    hourlyForecastHours: 48,
    dailyForecastDays: 14,
    savedLocations: 10,
    activityProfiles: 15,
    nlqPerDay: 20,
  },
  premium: {
    hourlyForecastHours: 336, // 14 days
    dailyForecastDays: 14,
    savedLocations: 50,
    activityProfiles: 50,
    nlqPerDay: Infinity,
  },
  enterprise: {
    hourlyForecastHours: Infinity,
    dailyForecastDays: Infinity,
    savedLocations: Infinity,
    activityProfiles: Infinity,
    nlqPerDay: Infinity,
  },
} as const;

// ── Notification Caps ────────────────────────────────────────

export const NOTIFICATION_CAPS = {
  dailyMax: 5,
  severeExempt: true,
  quietHoursDefault: { start: '22:00', end: '07:00' },
  throttleAfterIgnored: 3,
  disableAfterWeeksIgnored: 2,
} as const;

// ── Cache TTLs (seconds) ─────────────────────────────────────

export const CACHE_TTL = {
  currentConditions: 300,      // 5 min
  hourlyForecast: 900,         // 15 min
  dailyForecast: 1800,         // 30 min
  radarTile: 300,              // 5 min
  radarTileCalm: 900,          // 15 min
  alerts: 60,                  // 1 min
  aqi: 3600,                   // 1 hr
  pollen: 3600,                // 1 hr
  historical: 86400,           // 24 hr
  climateNormals: 604800,      // 7 days
  geocoding: 86400,            // 24 hr
} as const;

// ── Weather Thresholds ───────────────────────────────────────

export const THRESHOLDS = {
  feelsLikeDelta: 5,          // Show feels-like when delta >= 5°F
  tempSwingAlert: 15,         // Alert when >15°F change in 3hr
  precipImminentMinutes: 15,  // Alert when rain <15 min away
  precipImminentRadius: 30,   // Check 30-mile radius
  aqiUnhealthy: 101,
  uvHigh: 6,
  uvVeryHigh: 8,
  uvExtreme: 11,
  frostTemp: 32,
  heatIndexDanger: 105,
  windChillDanger: -20,
  wbgtOsha: 82,
  pressureDropMigraine: 6,    // mb drop in 6 hours
  dewpointComfort: {
    dry: 55,
    comfortable: 60,
    humid: 65,
    oppressive: 70,
    miserable: 75,
  },
} as const;

// ── Beaufort Wind Scale ──────────────────────────────────────

export const BEAUFORT_SCALE = [
  { force: 0, maxMph: 1, label: 'Calm' },
  { force: 1, maxMph: 3, label: 'Light air' },
  { force: 2, maxMph: 7, label: 'Light breeze' },
  { force: 3, maxMph: 12, label: 'Gentle breeze' },
  { force: 4, maxMph: 18, label: 'Moderate breeze' },
  { force: 5, maxMph: 24, label: 'Fresh breeze' },
  { force: 6, maxMph: 31, label: 'Strong breeze' },
  { force: 7, maxMph: 38, label: 'Near gale' },
  { force: 8, maxMph: 46, label: 'Gale' },
  { force: 9, maxMph: 54, label: 'Strong gale' },
  { force: 10, maxMph: 63, label: 'Storm' },
  { force: 11, maxMph: 73, label: 'Violent storm' },
  { force: 12, maxMph: Infinity, label: 'Hurricane force' },
] as const;

// ── AQI Breakpoints ──────────────────────────────────────────

export const AQI_BREAKPOINTS = [
  { max: 50, category: 'good', color: '#22C55E' },
  { max: 100, category: 'moderate', color: '#EAB308' },
  { max: 150, category: 'unhealthy_sensitive', color: '#F97316' },
  { max: 200, category: 'unhealthy', color: '#EF4444' },
  { max: 300, category: 'very_unhealthy', color: '#A855F7' },
  { max: 500, category: 'hazardous', color: '#7F1D1D' },
] as const;

// ── UV Index Categories ──────────────────────────────────────

export const UV_CATEGORIES = [
  { max: 2, category: 'low', color: '#22C55E' },
  { max: 5, category: 'moderate', color: '#EAB308' },
  { max: 7, category: 'high', color: '#F97316' },
  { max: 10, category: 'very_high', color: '#EF4444' },
  { max: Infinity, category: 'extreme', color: '#A855F7' },
] as const;

// ── Wind Compass ─────────────────────────────────────────────

export const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

// ── Default User Preferences ─────────────────────────────────

export const DEFAULT_PREFERENCES = {
  units: {
    temp: 'F' as const,
    wind: 'mph' as const,
    pressure: 'inHg' as const,
    precip: 'in' as const,
    distance: 'mi' as const,
  },
  tone: 'straight_facts' as const,
  theme: 'auto' as const,
  reducedMotion: false,
  simpleMode: false,
  language: 'en',
} as const;
