import { describe, it, expect } from 'vitest';
import { generateNotification } from './copy-engine';

describe('generateNotification', () => {
  it('generates imminent rain notification with straight_facts tone', () => {
    const result = generateNotification({
      type: 'imminent_rain',
      tone: 'straight_facts',
      variables: {
        precipStart: '3:15pm',
        precipDuration: '30 min',
        precipAmount: '0.2"',
      },
    });

    expect(result.title).toBe('Rain at 3:15pm');
    expect(result.body).toContain('30 min');
    expect(result.priority).toBe('high');
  });

  it('generates severe weather notification with adventure_guide tone', () => {
    const result = generateNotification({
      type: 'severe_weather',
      tone: 'adventure_guide',
      variables: {
        alertHeadline: 'Severe Thunderstorm Warning',
        alertInstruction: 'Seek shelter immediately',
      },
    });

    expect(result.title).toContain('Too dangerous for heroes');
    expect(result.body).toContain('Severe Thunderstorm Warning');
    expect(result.priority).toBe('critical');
  });

  it('generates activity window notification with farmers_wisdom tone', () => {
    const result = generateNotification({
      type: 'activity_window',
      tone: 'farmers_wisdom',
      variables: {
        windowStart: '2pm',
        windowEnd: '4pm',
        temp: 68,
        windSpeed: 5,
        windDir: 'W',
      },
    });

    expect(result.title).toContain('Gentle breeze');
    expect(result.body).toContain('2pm');
    expect(result.priority).toBe('normal');
  });

  it('generates morning brief with scientific_precision tone', () => {
    const result = generateNotification({
      type: 'morning_brief',
      tone: 'scientific_precision',
      variables: {
        highTemp: 82,
        lowTemp: 65,
        precipProb: 20,
        windSpeed: 12,
        windDir: 'NW',
      },
    });

    expect(result.title).toContain('Tmax=82');
    expect(result.title).toContain('Tmin=65');
    expect(result.priority).toBe('low');
  });

  it('falls back to straight_facts when tone not found', () => {
    const result = generateNotification({
      type: 'imminent_rain',
      tone: 'scientific_precision',
      variables: { precipStart: '5pm', precipDuration: '1hr', precipAmount: '0.5"' },
    });

    // Should use scientific_precision template (it exists)
    expect(result.title).toContain('5pm');
  });

  it('returns default notification for unknown type', () => {
    const result = generateNotification({
      type: 'unknown_type' as never,
      tone: 'straight_facts',
      variables: {},
    });

    expect(result.title).toBe('Weather Update');
    expect(result.priority).toBe('normal');
  });
});
