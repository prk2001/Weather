import type { NotificationType, NotificationTone } from '@aether/shared';

export interface NotificationPayload {
  type: NotificationType;
  tone: NotificationTone;
  variables: NotificationVariables;
}

export interface NotificationVariables {
  temp?: number;
  feelsLike?: number;
  precipStart?: string;    // "3:15pm"
  precipEnd?: string;
  precipDuration?: string; // "30 min"
  precipAmount?: string;   // '0.2"'
  windSpeed?: number;
  windDir?: string;
  activity?: string;
  activityScore?: number;
  windowStart?: string;
  windowEnd?: string;
  windowDuration?: string;
  severity?: string;
  alertHeadline?: string;
  alertInstruction?: string;
  highTemp?: number;
  lowTemp?: number;
  precipProb?: number;
  aqiValue?: number;
  aqiCategory?: string;
  accuracy?: number;       // percentage
  locationName?: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  tone: NotificationTone;
  title: string;
  body: string;
}

export interface GeneratedNotification {
  title: string;
  body: string;
  type: NotificationType;
  tone: NotificationTone;
  priority: 'low' | 'normal' | 'high' | 'critical';
}
