import type { NotificationType, NotificationTone } from '@aether/shared';
import type { NotificationPayload, NotificationVariables, GeneratedNotification } from './types';
import { NOTIFICATION_TEMPLATES } from './templates';

/**
 * Generate a notification by matching type + tone, then substituting variables.
 */
export function generateNotification(payload: NotificationPayload): GeneratedNotification {
  const { type, tone, variables } = payload;

  // Find matching template
  let template = NOTIFICATION_TEMPLATES.find(
    (t) => t.type === type && t.tone === tone,
  );

  // Fallback to straight_facts if tone not found
  if (!template) {
    template = NOTIFICATION_TEMPLATES.find(
      (t) => t.type === type && t.tone === 'straight_facts',
    );
  }

  if (!template) {
    return {
      title: 'Weather Update',
      body: 'Check your forecast for the latest conditions.',
      type,
      tone,
      priority: 'normal',
    };
  }

  const title = substituteVariables(template.title, variables);
  const body = substituteVariables(template.body, variables);

  return {
    title,
    body,
    type,
    tone,
    priority: getPriority(type),
  };
}

function substituteVariables(text: string, variables: NotificationVariables): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = variables[key as keyof NotificationVariables];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

function getPriority(type: NotificationType): GeneratedNotification['priority'] {
  switch (type) {
    case 'severe_weather':
      return 'critical';
    case 'imminent_rain':
    case 'temp_swing':
    case 'aqi_alert':
      return 'high';
    case 'activity_window':
    case 'commute_alert':
      return 'normal';
    case 'morning_brief':
    case 'evening_recap':
    case 'weekly_wins':
      return 'low';
    default:
      return 'normal';
  }
}
