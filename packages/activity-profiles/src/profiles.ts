// ============================================================
// AETHER Activity Profiles
// All 50 activity profiles with weather condition thresholds
// ============================================================

import type { ActivityType } from '@aether/shared';

/**
 * Defines the weather conditions under which an activity is optimal,
 * acceptable, or inadvisable.
 */
export interface ActivityProfile {
  /** Internal activity type key */
  type: ActivityType | string;
  /** Human-readable display name */
  name: string;
  /** Emoji icon for UI display */
  icon: string;
  /** Optimal temperature range [min, max] in Fahrenheit */
  optimalTemp: [number, number];
  /** Acceptable temperature range [min, max] in Fahrenheit */
  okTemp: [number, number];
  /** Maximum tolerable wind speed in mph */
  maxWind: number;
  /** Maximum acceptable precipitation probability (0-100) */
  maxPrecipProb: number;
  /** Maximum acceptable UV index */
  maxUV: number;
  /** Minimum acceptable visibility in miles */
  minVisibility: number;
  /** Maximum acceptable humidity percentage (0-100) */
  maxHumidity: number;
  /** Short description of ideal conditions */
  description: string;
}

// ── Launch Activities (15) ──────────────────────────────────

const running: ActivityProfile = {
  type: 'running',
  name: 'Running',
  icon: '🏃',
  optimalTemp: [45, 65],
  okTemp: [30, 85],
  maxWind: 25,
  maxPrecipProb: 30,
  maxUV: 9,
  minVisibility: 1,
  maxHumidity: 80,
  description: 'Cool, dry conditions with low humidity for optimal performance',
};

const cycling: ActivityProfile = {
  type: 'cycling',
  name: 'Cycling',
  icon: '🚴',
  optimalTemp: [55, 75],
  okTemp: [40, 90],
  maxWind: 20,
  maxPrecipProb: 15,
  maxUV: 10,
  minVisibility: 3,
  maxHumidity: 85,
  description: 'Mild temps with calm winds and dry roads for safe riding',
};

const hiking: ActivityProfile = {
  type: 'hiking',
  name: 'Hiking',
  icon: '🥾',
  optimalTemp: [50, 75],
  okTemp: [30, 90],
  maxWind: 30,
  maxPrecipProb: 25,
  maxUV: 10,
  minVisibility: 3,
  maxHumidity: 85,
  description: 'Comfortable temps with good visibility and low rain chance',
};

const surfing: ActivityProfile = {
  type: 'surfing',
  name: 'Surfing',
  icon: '🏄',
  optimalTemp: [60, 85],
  okTemp: [45, 95],
  maxWind: 25,
  maxPrecipProb: 70,
  maxUV: 11,
  minVisibility: 2,
  maxHumidity: 100,
  description: 'Warm air temps with offshore winds; rain is irrelevant',
};

const stargazing: ActivityProfile = {
  type: 'stargazing',
  name: 'Stargazing',
  icon: '🔭',
  optimalTemp: [40, 75],
  okTemp: [20, 85],
  maxWind: 15,
  maxPrecipProb: 5,
  maxUV: 0,
  minVisibility: 10,
  maxHumidity: 70,
  description: 'Clear, dark skies with minimal clouds and excellent visibility',
};

const photography: ActivityProfile = {
  type: 'photography',
  name: 'Photography',
  icon: '📸',
  optimalTemp: [40, 80],
  okTemp: [20, 95],
  maxWind: 20,
  maxPrecipProb: 20,
  maxUV: 11,
  minVisibility: 5,
  maxHumidity: 85,
  description: 'Dramatic light conditions with good visibility; golden hour preferred',
};

const grilling: ActivityProfile = {
  type: 'grilling',
  name: 'Grilling/BBQ',
  icon: '🍖',
  optimalTemp: [65, 85],
  okTemp: [50, 95],
  maxWind: 20,
  maxPrecipProb: 15,
  maxUV: 11,
  minVisibility: 1,
  maxHumidity: 85,
  description: 'Warm, dry conditions with manageable winds for outdoor cooking',
};

const gardening: ActivityProfile = {
  type: 'gardening',
  name: 'Gardening',
  icon: '🌱',
  optimalTemp: [55, 80],
  okTemp: [40, 90],
  maxWind: 20,
  maxPrecipProb: 30,
  maxUV: 8,
  minVisibility: 1,
  maxHumidity: 90,
  description: 'Mild temps with overcast skies and low UV for comfortable outdoor work',
};

const fishing: ActivityProfile = {
  type: 'fishing',
  name: 'Fishing',
  icon: '🎣',
  optimalTemp: [55, 80],
  okTemp: [35, 90],
  maxWind: 15,
  maxPrecipProb: 40,
  maxUV: 11,
  minVisibility: 2,
  maxHumidity: 95,
  description: 'Overcast and calm with stable barometric pressure',
};

const golf: ActivityProfile = {
  type: 'golf',
  name: 'Golf',
  icon: '⛳',
  optimalTemp: [60, 80],
  okTemp: [45, 90],
  maxWind: 20,
  maxPrecipProb: 15,
  maxUV: 10,
  minVisibility: 3,
  maxHumidity: 85,
  description: 'Warm and dry with light winds for accurate play',
};

const dogWalking: ActivityProfile = {
  type: 'dog_walking',
  name: 'Dog Walking',
  icon: '🐕',
  optimalTemp: [45, 75],
  okTemp: [25, 85],
  maxWind: 25,
  maxPrecipProb: 40,
  maxUV: 9,
  minVisibility: 1,
  maxHumidity: 90,
  description: 'Comfortable temps safe for paw pads; avoid extreme heat or cold',
};

const wedding: ActivityProfile = {
  type: 'wedding',
  name: 'Outdoor Wedding',
  icon: '💒',
  optimalTemp: [65, 80],
  okTemp: [55, 85],
  maxWind: 15,
  maxPrecipProb: 10,
  maxUV: 8,
  minVisibility: 5,
  maxHumidity: 70,
  description: 'Picture-perfect weather with zero rain risk and pleasant temps',
};

const migraineRisk: ActivityProfile = {
  type: 'migraine_risk',
  name: 'Migraine Risk',
  icon: '🤕',
  optimalTemp: [55, 75],
  okTemp: [40, 85],
  maxWind: 30,
  maxPrecipProb: 80,
  maxUV: 11,
  minVisibility: 1,
  maxHumidity: 60,
  description: 'Stable barometric pressure and moderate humidity reduce migraine triggers',
};

const allergyAlert: ActivityProfile = {
  type: 'allergy_alert',
  name: 'Allergy Alert',
  icon: '🤧',
  optimalTemp: [50, 70],
  okTemp: [35, 85],
  maxWind: 10,
  maxPrecipProb: 50,
  maxUV: 11,
  minVisibility: 3,
  maxHumidity: 70,
  description: 'Low wind and recent rain to keep pollen counts down',
};

const snowSports: ActivityProfile = {
  type: 'snow_sports',
  name: 'Snow Sports',
  icon: '⛷️',
  optimalTemp: [15, 32],
  okTemp: [-10, 38],
  maxWind: 25,
  maxPrecipProb: 100,
  maxUV: 11,
  minVisibility: 1,
  maxHumidity: 100,
  description: 'Cold with fresh snow; light snowfall welcome for powder conditions',
};

// ── Post-Launch Activities (35) ─────────────────────────────

const swimming: ActivityProfile = {
  type: 'swimming',
  name: 'Swimming',
  icon: '🏊',
  optimalTemp: [75, 95],
  okTemp: [65, 100],
  maxWind: 20,
  maxPrecipProb: 30,
  maxUV: 11,
  minVisibility: 1,
  maxHumidity: 100,
  description: 'Hot weather with sunshine; thunderstorms are the only dealbreaker',
};

const tennis: ActivityProfile = {
  type: 'tennis',
  name: 'Tennis',
  icon: '🎾',
  optimalTemp: [60, 80],
  okTemp: [45, 90],
  maxWind: 15,
  maxPrecipProb: 10,
  maxUV: 9,
  minVisibility: 3,
  maxHumidity: 80,
  description: 'Dry courts with moderate temps and calm winds for consistent ball flight',
};

const soccer: ActivityProfile = {
  type: 'soccer',
  name: 'Soccer',
  icon: '⚽',
  optimalTemp: [50, 75],
  okTemp: [35, 90],
  maxWind: 25,
  maxPrecipProb: 40,
  maxUV: 10,
  minVisibility: 2,
  maxHumidity: 85,
  description: 'Cool to mild with manageable wind for accurate passing',
};

const basketball: ActivityProfile = {
  type: 'basketball',
  name: 'Outdoor Basketball',
  icon: '🏀',
  optimalTemp: [55, 80],
  okTemp: [40, 95],
  maxWind: 20,
  maxPrecipProb: 10,
  maxUV: 10,
  minVisibility: 1,
  maxHumidity: 80,
  description: 'Dry court surface with comfortable temps for sustained play',
};

const yoga: ActivityProfile = {
  type: 'yoga',
  name: 'Outdoor Yoga',
  icon: '🧘',
  optimalTemp: [65, 80],
  okTemp: [55, 88],
  maxWind: 10,
  maxPrecipProb: 5,
  maxUV: 7,
  minVisibility: 1,
  maxHumidity: 75,
  description: 'Warm and calm with gentle breeze and low UV for peaceful practice',
};

const rockClimbing: ActivityProfile = {
  type: 'rock_climbing',
  name: 'Rock Climbing',
  icon: '🧗',
  optimalTemp: [45, 70],
  okTemp: [30, 85],
  maxWind: 20,
  maxPrecipProb: 5,
  maxUV: 10,
  minVisibility: 5,
  maxHumidity: 65,
  description: 'Cool and dry for good grip; no rain to keep rock faces safe',
};

const kayaking: ActivityProfile = {
  type: 'kayaking',
  name: 'Kayaking',
  icon: '🛶',
  optimalTemp: [60, 85],
  okTemp: [45, 95],
  maxWind: 15,
  maxPrecipProb: 40,
  maxUV: 11,
  minVisibility: 3,
  maxHumidity: 100,
  description: 'Calm winds for safe paddling; light rain acceptable',
};

const sailing: ActivityProfile = {
  type: 'sailing',
  name: 'Sailing',
  icon: '⛵',
  optimalTemp: [55, 85],
  okTemp: [40, 95],
  maxWind: 25,
  maxPrecipProb: 30,
  maxUV: 11,
  minVisibility: 5,
  maxHumidity: 100,
  description: 'Steady moderate winds with good visibility; no thunderstorms',
};

const camping: ActivityProfile = {
  type: 'camping',
  name: 'Camping',
  icon: '🏕️',
  optimalTemp: [50, 80],
  okTemp: [30, 90],
  maxWind: 20,
  maxPrecipProb: 20,
  maxUV: 11,
  minVisibility: 2,
  maxHumidity: 85,
  description: 'Pleasant overnight temps with dry conditions for outdoor sleeping',
};

const picnic: ActivityProfile = {
  type: 'picnic',
  name: 'Picnic',
  icon: '🧺',
  optimalTemp: [65, 82],
  okTemp: [55, 90],
  maxWind: 15,
  maxPrecipProb: 10,
  maxUV: 8,
  minVisibility: 3,
  maxHumidity: 75,
  description: 'Warm sunshine with no rain and gentle breeze',
};

const beachDay: ActivityProfile = {
  type: 'beach_day',
  name: 'Beach Day',
  icon: '🏖️',
  optimalTemp: [78, 92],
  okTemp: [70, 100],
  maxWind: 20,
  maxPrecipProb: 15,
  maxUV: 11,
  minVisibility: 3,
  maxHumidity: 100,
  description: 'Hot and sunny with light onshore breeze',
};

const birdWatching: ActivityProfile = {
  type: 'bird_watching',
  name: 'Bird Watching',
  icon: '🦅',
  optimalTemp: [45, 75],
  okTemp: [30, 85],
  maxWind: 15,
  maxPrecipProb: 20,
  maxUV: 10,
  minVisibility: 5,
  maxHumidity: 90,
  description: 'Calm morning conditions with good visibility for spotting',
};

const kiteFlying: ActivityProfile = {
  type: 'kite_flying',
  name: 'Kite Flying',
  icon: '🪁',
  optimalTemp: [50, 80],
  okTemp: [40, 90],
  maxWind: 30,
  maxPrecipProb: 10,
  maxUV: 11,
  minVisibility: 3,
  maxHumidity: 90,
  description: 'Steady moderate to strong winds without precipitation',
};

const skateboarding: ActivityProfile = {
  type: 'skateboarding',
  name: 'Skateboarding',
  icon: '🛹',
  optimalTemp: [55, 80],
  okTemp: [40, 95],
  maxWind: 15,
  maxPrecipProb: 5,
  maxUV: 10,
  minVisibility: 2,
  maxHumidity: 80,
  description: 'Dry surfaces with mild wind for safe riding',
};

const trailRunning: ActivityProfile = {
  type: 'trail_running',
  name: 'Trail Running',
  icon: '🏔️',
  optimalTemp: [40, 65],
  okTemp: [25, 80],
  maxWind: 25,
  maxPrecipProb: 20,
  maxUV: 10,
  minVisibility: 3,
  maxHumidity: 80,
  description: 'Cool temps with dry trails for good footing',
};

const horseback: ActivityProfile = {
  type: 'horseback',
  name: 'Horseback Riding',
  icon: '🐴',
  optimalTemp: [50, 80],
  okTemp: [35, 90],
  maxWind: 20,
  maxPrecipProb: 20,
  maxUV: 10,
  minVisibility: 3,
  maxHumidity: 85,
  description: 'Calm conditions comfortable for both rider and horse',
};

const outdoorDining: ActivityProfile = {
  type: 'outdoor_dining',
  name: 'Outdoor Dining',
  icon: '🍽️',
  optimalTemp: [65, 82],
  okTemp: [55, 90],
  maxWind: 15,
  maxPrecipProb: 10,
  maxUV: 8,
  minVisibility: 1,
  maxHumidity: 75,
  description: 'Pleasant evening temps with no wind blowing napkins off the table',
};

const carWashing: ActivityProfile = {
  type: 'car_washing',
  name: 'Car Washing',
  icon: '🚗',
  optimalTemp: [55, 85],
  okTemp: [40, 95],
  maxWind: 15,
  maxPrecipProb: 5,
  maxUV: 11,
  minVisibility: 1,
  maxHumidity: 80,
  description: 'Dry with low chance of rain for the next several hours',
};

const windowWashing: ActivityProfile = {
  type: 'window_washing',
  name: 'Window Washing',
  icon: '🪟',
  optimalTemp: [50, 80],
  okTemp: [40, 90],
  maxWind: 10,
  maxPrecipProb: 5,
  maxUV: 8,
  minVisibility: 1,
  maxHumidity: 70,
  description: 'Overcast skies prevent streaking; low humidity helps drying',
};

const lawnMowing: ActivityProfile = {
  type: 'lawn_mowing',
  name: 'Lawn Mowing',
  icon: '🌿',
  optimalTemp: [55, 80],
  okTemp: [45, 90],
  maxWind: 20,
  maxPrecipProb: 15,
  maxUV: 9,
  minVisibility: 1,
  maxHumidity: 80,
  description: 'Dry grass with comfortable temps for yard work',
};

const roofWork: ActivityProfile = {
  type: 'roof_work',
  name: 'Roof Work',
  icon: '🏠',
  optimalTemp: [50, 80],
  okTemp: [40, 90],
  maxWind: 10,
  maxPrecipProb: 5,
  maxUV: 9,
  minVisibility: 3,
  maxHumidity: 75,
  description: 'Dry, calm conditions essential for safe elevated work',
};

const painting: ActivityProfile = {
  type: 'painting',
  name: 'Exterior Painting',
  icon: '🎨',
  optimalTemp: [50, 85],
  okTemp: [40, 90],
  maxWind: 10,
  maxPrecipProb: 5,
  maxUV: 11,
  minVisibility: 1,
  maxHumidity: 70,
  description: 'Low humidity and no rain for proper paint adhesion and drying',
};

const marathon: ActivityProfile = {
  type: 'marathon',
  name: 'Marathon/Race',
  icon: '🏅',
  optimalTemp: [40, 58],
  okTemp: [30, 70],
  maxWind: 15,
  maxPrecipProb: 20,
  maxUV: 8,
  minVisibility: 2,
  maxHumidity: 70,
  description: 'Cool and dry with low humidity for peak endurance performance',
};

const outdoorConcert: ActivityProfile = {
  type: 'outdoor_concert',
  name: 'Outdoor Concert',
  icon: '🎶',
  optimalTemp: [60, 82],
  okTemp: [50, 90],
  maxWind: 15,
  maxPrecipProb: 15,
  maxUV: 8,
  minVisibility: 1,
  maxHumidity: 80,
  description: 'Pleasant evening weather with no rain to dampen the show',
};

const astronomy: ActivityProfile = {
  type: 'astronomy',
  name: 'Astrophotography',
  icon: '🌌',
  optimalTemp: [35, 70],
  okTemp: [15, 80],
  maxWind: 10,
  maxPrecipProb: 5,
  maxUV: 0,
  minVisibility: 10,
  maxHumidity: 60,
  description: 'Crystal clear skies with low humidity and no wind vibration',
};

const droneFlying: ActivityProfile = {
  type: 'drone_flying',
  name: 'Drone Flying',
  icon: '🚁',
  optimalTemp: [45, 85],
  okTemp: [32, 95],
  maxWind: 15,
  maxPrecipProb: 5,
  maxUV: 11,
  minVisibility: 5,
  maxHumidity: 90,
  description: 'Calm winds and dry conditions for stable flight and safe operation',
};

const gardenParty: ActivityProfile = {
  type: 'garden_party',
  name: 'Garden Party',
  icon: '🎉',
  optimalTemp: [65, 82],
  okTemp: [58, 88],
  maxWind: 12,
  maxPrecipProb: 10,
  maxUV: 8,
  minVisibility: 3,
  maxHumidity: 70,
  description: 'Warm, calm, and dry with pleasant afternoon and evening temps',
};

const sunbathing: ActivityProfile = {
  type: 'sunbathing',
  name: 'Sunbathing',
  icon: '☀️',
  optimalTemp: [78, 92],
  okTemp: [70, 100],
  maxWind: 15,
  maxPrecipProb: 5,
  maxUV: 11,
  minVisibility: 3,
  maxHumidity: 80,
  description: 'Hot, sunny, and calm for soaking up rays',
};

const snowshoeing: ActivityProfile = {
  type: 'snowshoeing',
  name: 'Snowshoeing',
  icon: '🦶',
  optimalTemp: [10, 30],
  okTemp: [-5, 38],
  maxWind: 20,
  maxPrecipProb: 60,
  maxUV: 10,
  minVisibility: 2,
  maxHumidity: 100,
  description: 'Snowy terrain with manageable cold and calm winds',
};

const iceFishing: ActivityProfile = {
  type: 'ice_fishing',
  name: 'Ice Fishing',
  icon: '🧊',
  optimalTemp: [5, 28],
  okTemp: [-15, 32],
  maxWind: 15,
  maxPrecipProb: 40,
  maxUV: 8,
  minVisibility: 2,
  maxHumidity: 100,
  description: 'Cold enough for solid ice with tolerable wind chill',
};

const outdoorWorkout: ActivityProfile = {
  type: 'outdoor_workout',
  name: 'Outdoor Workout',
  icon: '💪',
  optimalTemp: [50, 72],
  okTemp: [35, 88],
  maxWind: 20,
  maxPrecipProb: 20,
  maxUV: 9,
  minVisibility: 1,
  maxHumidity: 75,
  description: 'Cool and dry conditions for high-intensity exercise',
};

const paragliding: ActivityProfile = {
  type: 'paragliding',
  name: 'Paragliding',
  icon: '🪂',
  optimalTemp: [55, 80],
  okTemp: [40, 90],
  maxWind: 18,
  maxPrecipProb: 5,
  maxUV: 11,
  minVisibility: 8,
  maxHumidity: 85,
  description: 'Steady thermals with light winds and excellent visibility',
};

const mountainBiking: ActivityProfile = {
  type: 'mountain_biking',
  name: 'Mountain Biking',
  icon: '🚵',
  optimalTemp: [50, 75],
  okTemp: [35, 88],
  maxWind: 20,
  maxPrecipProb: 15,
  maxUV: 10,
  minVisibility: 3,
  maxHumidity: 80,
  description: 'Dry trails with cool temps for technical riding',
};

const paddleboarding: ActivityProfile = {
  type: 'paddleboarding',
  name: 'Paddleboarding',
  icon: '🏄‍♂️',
  optimalTemp: [70, 90],
  okTemp: [60, 98],
  maxWind: 12,
  maxPrecipProb: 20,
  maxUV: 11,
  minVisibility: 3,
  maxHumidity: 100,
  description: 'Warm and flat water with calm winds for balance',
};

const stargazingParty: ActivityProfile = {
  type: 'stargazing_party',
  name: 'Star Party',
  icon: '✨',
  optimalTemp: [45, 75],
  okTemp: [25, 85],
  maxWind: 10,
  maxPrecipProb: 5,
  maxUV: 0,
  minVisibility: 10,
  maxHumidity: 65,
  description: 'Gathering for telescope viewing; needs crystal clear, calm skies',
};

// ============================================================
// Master record of all 50 activity profiles
// ============================================================

export const ACTIVITY_PROFILES: Record<string, ActivityProfile> = {
  // Launch activities (15)
  running,
  cycling,
  hiking,
  surfing,
  stargazing,
  photography,
  grilling,
  gardening,
  fishing,
  golf,
  dog_walking: dogWalking,
  wedding,
  migraine_risk: migraineRisk,
  allergy_alert: allergyAlert,
  snow_sports: snowSports,

  // Post-launch activities (35)
  swimming,
  tennis,
  soccer,
  basketball,
  yoga,
  rock_climbing: rockClimbing,
  kayaking,
  sailing,
  camping,
  picnic,
  beach_day: beachDay,
  bird_watching: birdWatching,
  kite_flying: kiteFlying,
  skateboarding,
  trail_running: trailRunning,
  horseback,
  outdoor_dining: outdoorDining,
  car_washing: carWashing,
  window_washing: windowWashing,
  lawn_mowing: lawnMowing,
  roof_work: roofWork,
  painting,
  marathon,
  outdoor_concert: outdoorConcert,
  astronomy,
  drone_flying: droneFlying,
  garden_party: gardenParty,
  sunbathing,
  snowshoeing,
  ice_fishing: iceFishing,
  outdoor_workout: outdoorWorkout,
  paragliding,
  mountain_biking: mountainBiking,
  paddleboarding,
  stargazing_party: stargazingParty,
};

/** List of activity keys available at launch (Phase 1) */
export const LAUNCH_ACTIVITY_KEYS = [
  'running',
  'cycling',
  'hiking',
  'surfing',
  'stargazing',
  'photography',
  'grilling',
  'gardening',
  'fishing',
  'golf',
  'dog_walking',
  'wedding',
  'migraine_risk',
  'allergy_alert',
  'snow_sports',
] as const;

/** Get a single activity profile by key */
export function getActivityProfile(key: string): ActivityProfile | undefined {
  return ACTIVITY_PROFILES[key];
}

/** Get all activity profiles as an array */
export function getAllProfiles(): ActivityProfile[] {
  return Object.values(ACTIVITY_PROFILES);
}

/** Get only launch-ready activity profiles */
export function getLaunchProfiles(): ActivityProfile[] {
  return LAUNCH_ACTIVITY_KEYS.map((key) => ACTIVITY_PROFILES[key]!);
}
