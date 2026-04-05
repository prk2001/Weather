import type { NotificationTemplate } from './types';

/**
 * Notification copy matrix: Type x Tone
 * Variables use {curly_braces} for substitution
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ── Imminent Rain ──────────────────────────────────────────
  {
    type: 'imminent_rain',
    tone: 'straight_facts',
    title: 'Rain at {precipStart}',
    body: '{precipDuration} of rain. {precipAmount} expected.',
  },
  {
    type: 'imminent_rain',
    tone: 'gentle_nudge',
    title: 'Heads up — rain incoming',
    body: 'Looks like rain starting around {precipStart}. Might want to grab an umbrella.',
  },
  {
    type: 'imminent_rain',
    tone: 'adventure_guide',
    title: 'Sprinkles incoming',
    body: 'Rain at {precipStart} — keep going or find cover. Your call, adventurer.',
  },
  {
    type: 'imminent_rain',
    tone: 'farmers_wisdom',
    title: "Shower's coming",
    body: 'Ground drinks for {precipDuration} starting {precipStart}. Bring in the laundry.',
  },
  {
    type: 'imminent_rain',
    tone: 'scientific_precision',
    title: 'Precipitation onset: {precipStart}',
    body: 'Duration: {precipDuration}. Accumulation: {precipAmount}. Radar-confirmed.',
  },

  // ── Temperature Swing ──────────────────────────────────────
  {
    type: 'temp_swing',
    tone: 'straight_facts',
    title: '{temp}\u00B0F now \u2192 {feelsLike}\u00B0F by evening',
    body: 'Significant temperature change ahead. Dress in layers.',
  },
  {
    type: 'temp_swing',
    tone: 'gentle_nudge',
    title: 'Temperature dropping',
    body: "It's {temp}\u00B0 now but heading to {feelsLike}\u00B0. A jacket would be smart.",
  },
  {
    type: 'temp_swing',
    tone: 'adventure_guide',
    title: 'That jacket? Go get it.',
    body: '{temp}\u00B0 now \u2192 {feelsLike}\u00B0 later. Layer up for the adventure.',
  },
  {
    type: 'temp_swing',
    tone: 'farmers_wisdom',
    title: 'Evening chill means business',
    body: '{temp}\u00B0 dropping to {feelsLike}\u00B0. Old bones feel it coming.',
  },
  {
    type: 'temp_swing',
    tone: 'scientific_precision',
    title: '\u0394T = {temp}\u00B0\u2192{feelsLike}\u00B0 within 3h',
    body: 'Advection event. Temperature gradient exceeds 15\u00B0F threshold.',
  },

  // ── Severe Weather ─────────────────────────────────────────
  {
    type: 'severe_weather',
    tone: 'straight_facts',
    title: '\u26A0\uFE0F {alertHeadline}',
    body: '{alertInstruction}',
  },
  {
    type: 'severe_weather',
    tone: 'gentle_nudge',
    title: '\u26A0\uFE0F Severe weather alert',
    body: '{alertHeadline}. Please take shelter and stay safe.',
  },
  {
    type: 'severe_weather',
    tone: 'adventure_guide',
    title: '\u26A0\uFE0F Too dangerous for heroes',
    body: '{alertHeadline}. Shelter now. Adventure can wait.',
  },
  {
    type: 'severe_weather',
    tone: 'farmers_wisdom',
    title: '\u26A0\uFE0F The sky is angry tonight',
    body: '{alertHeadline}. Get inside. {alertInstruction}',
  },
  {
    type: 'severe_weather',
    tone: 'scientific_precision',
    title: '\u26A0\uFE0F NWS {severity}: {alertHeadline}',
    body: '{alertInstruction}',
  },

  // ── Activity Window ────────────────────────────────────────
  {
    type: 'activity_window',
    tone: 'straight_facts',
    title: '{activity} window: {windowStart}\u2013{windowEnd}',
    body: '{temp}\u00B0F, {precipProb}% rain, {windSpeed}mph {windDir}. {windowDuration}.',
  },
  {
    type: 'activity_window',
    tone: 'gentle_nudge',
    title: 'Great time for {activity}',
    body: 'Conditions look ideal from {windowStart} to {windowEnd}.',
  },
  {
    type: 'activity_window',
    tone: 'adventure_guide',
    title: 'PR weather. Lace up.',
    body: '{activity} conditions are perfect: {temp}\u00B0, calm winds. Go at {windowStart}.',
  },
  {
    type: 'activity_window',
    tone: 'farmers_wisdom',
    title: 'Gentle breeze, good for a stride',
    body: '{windowStart} to {windowEnd} — {temp}\u00B0, {windSpeed}mph from the {windDir}.',
  },
  {
    type: 'activity_window',
    tone: 'scientific_precision',
    title: '{activity}: Score {activityScore}/100',
    body: '{windowStart}\u2013{windowEnd}. T={temp}\u00B0F, RH={precipProb}%, V\u2082={windSpeed}mph.',
  },

  // ── Morning Brief ──────────────────────────────────────────
  {
    type: 'morning_brief',
    tone: 'straight_facts',
    title: 'Today: {highTemp}\u00B0/{lowTemp}\u00B0',
    body: '{precipProb}% chance of rain. {windSpeed}mph winds.',
  },
  {
    type: 'morning_brief',
    tone: 'gentle_nudge',
    title: 'Good morning \u2014 here\u2019s today',
    body: 'High of {highTemp}\u00B0, low of {lowTemp}\u00B0. {precipProb}% rain chance.',
  },
  {
    type: 'morning_brief',
    tone: 'adventure_guide',
    title: 'Rise and check the sky',
    body: '{highTemp}\u00B0 today with {precipProb}% rain odds. Make it count.',
  },
  {
    type: 'morning_brief',
    tone: 'farmers_wisdom',
    title: 'Morning report from the almanac',
    body: 'High near {highTemp}\u00B0, low {lowTemp}\u00B0. {precipProb}% chance the fields get wet.',
  },
  {
    type: 'morning_brief',
    tone: 'scientific_precision',
    title: 'Forecast: Tmax={highTemp}\u00B0F Tmin={lowTemp}\u00B0F',
    body: 'PoP={precipProb}%. Sustained winds {windSpeed}mph {windDir}.',
  },

  // ── AQI Alert ──────────────────────────────────────────────
  {
    type: 'aqi_alert',
    tone: 'straight_facts',
    title: 'AQI: {aqiValue} ({aqiCategory})',
    body: 'Air quality has crossed your threshold. Limit outdoor exposure.',
  },
  {
    type: 'aqi_alert',
    tone: 'gentle_nudge',
    title: 'Air quality heads up',
    body: 'AQI is {aqiValue} ({aqiCategory}). Consider staying indoors for a bit.',
  },
  {
    type: 'aqi_alert',
    tone: 'adventure_guide',
    title: 'Bad air day',
    body: 'AQI hit {aqiValue}. Indoor workout today, champ.',
  },
  {
    type: 'aqi_alert',
    tone: 'farmers_wisdom',
    title: "The air's not right",
    body: "AQI at {aqiValue}. Keep the windows shut and the work light.",
  },
  {
    type: 'aqi_alert',
    tone: 'scientific_precision',
    title: 'AQI={aqiValue} [{aqiCategory}]',
    body: 'Threshold exceeded. Recommend PM2.5 filtration and reduced outdoor exertion.',
  },
];
