// ============================================================
// AETHER Haptic Feedback Pattern Definitions
// Cross-platform haptic patterns for weather events and UI
// ============================================================

// ── Types ───────────────────────────────────────────────────

export type HapticIntensityLevel = 'off' | 'light' | 'standard' | 'strong';

/**
 * iOS CoreHaptics engine parameters.
 * Maps to CHHapticPattern events.
 */
export interface CoreHapticsParams {
  /** CHHapticEvent type: 'hapticTransient' | 'hapticContinuous' */
  eventType: 'hapticTransient' | 'hapticContinuous';
  /** Array of haptic event descriptors */
  events: CoreHapticsEvent[];
}

export interface CoreHapticsEvent {
  /** Time offset in seconds from pattern start */
  time: number;
  /** Event type */
  type: 'hapticTransient' | 'hapticContinuous';
  /** Intensity 0.0-1.0 */
  intensity: number;
  /** Sharpness 0.0-1.0 */
  sharpness: number;
  /** Duration in seconds (only for hapticContinuous) */
  duration?: number;
}

/**
 * Android VibrationEffect parameters.
 * Maps to VibrationEffect.createWaveform() or createOneShot().
 */
export interface VibrationEffectParams {
  /** Vibration pattern: alternating wait/vibrate durations in ms */
  pattern: number[];
  /** Amplitude for each vibration segment (0-255, -1 for default) */
  amplitudes: number[];
  /** Repeat index (-1 for no repeat) */
  repeat: number;
}

/**
 * Intensity overrides per level.
 * Each level scales the base pattern intensity.
 */
export interface IntensityLevels {
  off: number;
  light: number;
  standard: number;
  strong: number;
}

/**
 * A complete haptic pattern definition with platform-specific params.
 */
export interface HapticPattern {
  /** Machine-readable pattern identifier */
  name: string;
  /** Human-readable description of when this pattern triggers */
  description: string;
  /** iOS CoreHaptics parameters */
  ios: CoreHapticsParams;
  /** Android VibrationEffect parameters */
  android: VibrationEffectParams;
  /** Intensity multiplier per user preference level */
  intensity: IntensityLevels;
}

// ── Pattern Definitions ─────────────────────────────────────

/**
 * Rain: 3x light impact pulses simulating raindrops.
 */
const rain: HapticPattern = {
  name: 'rain',
  description: 'Imminent rain notification - three gentle taps like raindrops',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 0.4, sharpness: 0.3 },
      { time: 0.15, type: 'hapticTransient', intensity: 0.5, sharpness: 0.35 },
      { time: 0.3, type: 'hapticTransient', intensity: 0.6, sharpness: 0.4 },
    ],
  },
  android: {
    pattern: [0, 40, 110, 50, 110, 60],
    amplitudes: [-1, 80, -1, 100, -1, 120],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.5, standard: 1.0, strong: 1.4 },
};

/**
 * Lightning near: warning-level notification for nearby lightning.
 */
const lightningNear: HapticPattern = {
  name: 'lightning_near',
  description: 'Lightning detected nearby - firm warning pulse',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 0.7, sharpness: 0.8 },
      { time: 0.1, type: 'hapticContinuous', intensity: 0.5, sharpness: 0.6, duration: 0.2 },
    ],
  },
  android: {
    pattern: [0, 100, 50, 200],
    amplitudes: [-1, 180, -1, 140],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.6, standard: 1.0, strong: 1.3 },
};

/**
 * Lightning close: error-level notification for dangerously close lightning.
 */
const lightningClose: HapticPattern = {
  name: 'lightning_close',
  description: 'Lightning dangerously close - urgent strong pulse',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 1.0, sharpness: 1.0 },
      { time: 0.08, type: 'hapticContinuous', intensity: 0.9, sharpness: 0.9, duration: 0.3 },
      { time: 0.5, type: 'hapticTransient', intensity: 1.0, sharpness: 1.0 },
    ],
  },
  android: {
    pattern: [0, 150, 80, 300, 80, 150],
    amplitudes: [-1, 255, -1, 230, -1, 255],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.7, standard: 1.0, strong: 1.2 },
};

/**
 * Severe weather: long custom pattern for tornado/hurricane/severe alerts.
 */
const severe: HapticPattern = {
  name: 'severe',
  description: 'Severe weather alert - sustained urgent vibration pattern',
  ios: {
    eventType: 'hapticContinuous',
    events: [
      { time: 0.0, type: 'hapticContinuous', intensity: 1.0, sharpness: 1.0, duration: 0.4 },
      { time: 0.5, type: 'hapticTransient', intensity: 1.0, sharpness: 1.0 },
      { time: 0.7, type: 'hapticContinuous', intensity: 0.9, sharpness: 0.9, duration: 0.4 },
      { time: 1.2, type: 'hapticTransient', intensity: 1.0, sharpness: 1.0 },
      { time: 1.4, type: 'hapticContinuous', intensity: 1.0, sharpness: 1.0, duration: 0.5 },
    ],
  },
  android: {
    pattern: [0, 400, 100, 100, 200, 400, 100, 100, 200, 500],
    amplitudes: [-1, 255, -1, 255, -1, 230, -1, 255, -1, 255],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.8, standard: 1.0, strong: 1.0 },
};

/**
 * Activity window found: ascending intensity pulses signaling a good window.
 */
const activityWindow: HapticPattern = {
  name: 'activity_window',
  description: 'Activity window found - ascending celebratory pulses',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 0.3, sharpness: 0.4 },
      { time: 0.12, type: 'hapticTransient', intensity: 0.5, sharpness: 0.5 },
      { time: 0.24, type: 'hapticTransient', intensity: 0.7, sharpness: 0.6 },
      { time: 0.36, type: 'hapticTransient', intensity: 0.9, sharpness: 0.7 },
    ],
  },
  android: {
    pattern: [0, 30, 80, 40, 80, 50, 80, 70],
    amplitudes: [-1, 60, -1, 100, -1, 150, -1, 210],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.5, standard: 1.0, strong: 1.3 },
};

/**
 * Timeline tick: light tap for scrolling through the hourly timeline.
 */
const timelineTick: HapticPattern = {
  name: 'timeline_tick',
  description: 'Timeline scrub tick - subtle detent for each hour marker',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 0.2, sharpness: 0.5 },
    ],
  },
  android: {
    pattern: [0, 10],
    amplitudes: [-1, 40],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.4, standard: 1.0, strong: 1.5 },
};

/**
 * Gesture confirm: light tap confirming a successful gesture (swipe, long-press, etc.).
 */
const gestureConfirm: HapticPattern = {
  name: 'gesture_confirm',
  description: 'Gesture confirmation - single clean tap acknowledging user action',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 0.4, sharpness: 0.6 },
    ],
  },
  android: {
    pattern: [0, 20],
    amplitudes: [-1, 80],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.5, standard: 1.0, strong: 1.4 },
};

/**
 * Temperature extreme: double warning pulse for dangerous heat or cold.
 */
const temperatureExtreme: HapticPattern = {
  name: 'temperature_extreme',
  description: 'Temperature extreme alert - double warning pulse for dangerous temps',
  ios: {
    eventType: 'hapticTransient',
    events: [
      { time: 0.0, type: 'hapticTransient', intensity: 0.8, sharpness: 0.7 },
      { time: 0.15, type: 'hapticTransient', intensity: 0.8, sharpness: 0.7 },
      { time: 0.45, type: 'hapticTransient', intensity: 0.8, sharpness: 0.7 },
      { time: 0.6, type: 'hapticTransient', intensity: 0.8, sharpness: 0.7 },
    ],
  },
  android: {
    pattern: [0, 80, 70, 80, 200, 80, 70, 80],
    amplitudes: [-1, 200, -1, 200, -1, 200, -1, 200],
    repeat: -1,
  },
  intensity: { off: 0, light: 0.6, standard: 1.0, strong: 1.3 },
};

// ── Exports ─────────────────────────────────────────────────

/** All defined haptic patterns keyed by name */
export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  rain,
  lightning_near: lightningNear,
  lightning_close: lightningClose,
  severe,
  activity_window: activityWindow,
  timeline_tick: timelineTick,
  gesture_confirm: gestureConfirm,
  temperature_extreme: temperatureExtreme,
};

/** Retrieve a haptic pattern by name */
export function getHapticPattern(name: string): HapticPattern | undefined {
  return HAPTIC_PATTERNS[name];
}

/**
 * Scale a pattern's events to the given intensity level.
 * Returns a new pattern with adjusted intensity values.
 */
export function scalePatternIntensity(
  pattern: HapticPattern,
  level: HapticIntensityLevel,
): HapticPattern {
  const multiplier = pattern.intensity[level];
  if (multiplier === 0) {
    return {
      ...pattern,
      ios: { ...pattern.ios, events: [] },
      android: { ...pattern.android, amplitudes: pattern.android.amplitudes.map(() => 0) },
    };
  }

  return {
    ...pattern,
    ios: {
      ...pattern.ios,
      events: pattern.ios.events.map((event) => ({
        ...event,
        intensity: Math.min(1.0, event.intensity * multiplier),
      })),
    },
    android: {
      ...pattern.android,
      amplitudes: pattern.android.amplitudes.map((amp) =>
        amp === -1 ? -1 : Math.min(255, Math.round(amp * multiplier)),
      ),
    },
  };
}
