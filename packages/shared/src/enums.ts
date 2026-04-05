// ============================================================
// AETHER Enumerations
// ============================================================

export enum SubscriptionTier {
  Free = 'free',
  Pro = 'pro',
  Premium = 'premium',
  Enterprise = 'enterprise',
}

export enum TempUnit {
  Fahrenheit = 'F',
  Celsius = 'C',
}

export enum WindUnit {
  Mph = 'mph',
  Kph = 'kph',
  Knots = 'kts',
  Ms = 'ms',
}

export enum PressureUnit {
  InHg = 'inHg',
  Mb = 'mb',
  Hpa = 'hPa',
  Mmhg = 'mmHg',
}

export enum PrecipUnit {
  Inches = 'in',
  Millimeters = 'mm',
}

export enum DistanceUnit {
  Miles = 'mi',
  Kilometers = 'km',
}

export enum NotificationTone {
  StraightFacts = 'straight_facts',
  GentleNudge = 'gentle_nudge',
  AdventureGuide = 'adventure_guide',
  FarmersWisdom = 'farmers_wisdom',
  ScientificPrecision = 'scientific_precision',
}

export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export enum WeatherCondition {
  Clear = 'clear',
  PartlyCloudy = 'partly_cloudy',
  MostlyCloudy = 'mostly_cloudy',
  Overcast = 'overcast',
  Fog = 'fog',
  Drizzle = 'drizzle',
  LightRain = 'light_rain',
  Rain = 'rain',
  HeavyRain = 'heavy_rain',
  Thunderstorm = 'thunderstorm',
  SevereThunderstorm = 'severe_thunderstorm',
  LightSnow = 'light_snow',
  Snow = 'snow',
  HeavySnow = 'heavy_snow',
  Blizzard = 'blizzard',
  Sleet = 'sleet',
  FreezingRain = 'freezing_rain',
  Hail = 'hail',
  Dust = 'dust',
  Smoke = 'smoke',
  Haze = 'haze',
  Windy = 'windy',
  Tornado = 'tornado',
  Hurricane = 'hurricane',
}

export enum PrecipType {
  None = 'none',
  Rain = 'rain',
  Snow = 'snow',
  Sleet = 'sleet',
  FreezingRain = 'freezing_rain',
  Hail = 'hail',
  Mix = 'mix',
}

export enum AlertSeverity {
  Minor = 'minor',
  Moderate = 'moderate',
  Severe = 'severe',
  Extreme = 'extreme',
}

export enum AlertUrgency {
  Immediate = 'immediate',
  Expected = 'expected',
  Future = 'future',
  Past = 'past',
  Unknown = 'unknown',
}

export enum AlertCertainty {
  Observed = 'observed',
  Likely = 'likely',
  Possible = 'possible',
  Unlikely = 'unlikely',
  Unknown = 'unknown',
}

export enum ForecastModel {
  GFS = 'gfs',
  HRRR = 'hrrr',
  NAM = 'nam',
  ECMWF = 'ecmwf',
  ICON = 'icon',
  Blended = 'blended',
}

export enum ForecastConfidence {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum ActivityType {
  Running = 'running',
  Cycling = 'cycling',
  Hiking = 'hiking',
  Surfing = 'surfing',
  Stargazing = 'stargazing',
  Photography = 'photography',
  Grilling = 'grilling',
  Gardening = 'gardening',
  Fishing = 'fishing',
  Golf = 'golf',
  DogWalking = 'dog_walking',
  Wedding = 'wedding',
  MigraineRisk = 'migraine_risk',
  AllergyAlert = 'allergy_alert',
  SnowSports = 'snow_sports',
}

export enum NotificationType {
  ImminentRain = 'imminent_rain',
  TempSwing = 'temp_swing',
  SevereWeather = 'severe_weather',
  ActivityWindow = 'activity_window',
  CommuteAlert = 'commute_alert',
  AqiAlert = 'aqi_alert',
  MorningBrief = 'morning_brief',
  EveningRecap = 'evening_recap',
  WeeklyWins = 'weekly_wins',
  FirstFrost = 'first_frost',
  HeatAdvisory = 'heat_advisory',
}

export enum CommuteMode {
  Driving = 'driving',
  Walking = 'walking',
  Cycling = 'cycling',
  Transit = 'transit',
}

export enum DevicePlatform {
  IOS = 'ios',
  Android = 'android',
  Web = 'web',
  WatchOS = 'watchos',
  WearOS = 'wearos',
}

export enum CrowdsourceCondition {
  Rain = 'rain',
  Snow = 'snow',
  Hail = 'hail',
  Thunder = 'thunder',
  Tornado = 'tornado',
  Flooding = 'flooding',
  IceOnRoads = 'ice_on_roads',
  HighWinds = 'high_winds',
  Fog = 'fog',
  ClearSkies = 'clear_skies',
  Rainbow = 'rainbow',
  SunDogs = 'sun_dogs',
  WallCloud = 'wall_cloud',
}

export enum ReputationBadge {
  Observer = 'observer',
  WeatherWitness = 'weather_witness',
  WeatherHero = 'weather_hero',
  StormChaser = 'storm_chaser',
}

export enum WeatherWinType {
  DodgedRain = 'dodged_rain',
  FoundWindow = 'found_window',
  AvoidedExtreme = 'avoided_extreme',
  AccurateForecast = 'accurate_forecast',
}

export enum RadarProduct {
  BaseReflectivity = 'base_reflectivity',
  CompositeReflectivity = 'composite_reflectivity',
  Velocity = 'velocity',
  DualPol = 'dual_pol',
}

export enum SatelliteChannel {
  Visible = 'visible',
  Infrared = 'infrared',
  WaterVapor = 'water_vapor',
}

export enum AqiCategory {
  Good = 'good',
  Moderate = 'moderate',
  UnhealthySensitive = 'unhealthy_sensitive',
  Unhealthy = 'unhealthy',
  VeryUnhealthy = 'very_unhealthy',
  Hazardous = 'hazardous',
}

export enum UvCategory {
  Low = 'low',
  Moderate = 'moderate',
  High = 'high',
  VeryHigh = 'very_high',
  Extreme = 'extreme',
}

export enum SeasonalMode {
  Hurricane = 'hurricane',
  WinterStorm = 'winter_storm',
  WildfireSmoke = 'wildfire_smoke',
  SevereThunderstorm = 'severe_thunderstorm',
}

export enum AdaptiveTheme {
  DayClear = 'day_clear',
  DayOvercast = 'day_overcast',
  DayRain = 'day_rain',
  NightClear = 'night_clear',
  NightCloudy = 'night_cloudy',
  Severe = 'severe',
  Snow = 'snow',
}
