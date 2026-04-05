/**
 * Webhook delivery engine for AETHER.
 *
 * Dispatches JSON payloads to subscriber endpoints with HMAC signing,
 * exponential back-off retry, and condition evaluation.
 */

import { createHmac } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookTarget {
  id: string;
  url: string;
  secret: string | null;
}

export interface DeliveryResult {
  success: boolean;
  statusCode: number | null;
  durationMs: number;
  attempt: number;
  error?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  conditions: {
    lat: number;
    lon: number;
    radius: number;
    tempBelow?: number;
    tempAbove?: number;
    windAbove?: number;
    precipProbAbove?: number;
  };
}

export interface CurrentWeather {
  temp: number;
  windSpeed: number;
  precipProb: number;
  condition: string;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/**
 * Dispatch a webhook payload to a subscriber endpoint.
 * Signs the payload with HMAC-SHA256 if the subscription has a secret.
 */
export async function dispatchWebhook(
  target: WebhookTarget,
  payload: unknown,
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AETHER-Webhook/0.1.0',
    'X-Aether-Webhook-Id': target.id,
    'X-Aether-Delivery-Timestamp': new Date().toISOString(),
  };

  // HMAC signature
  if (target.secret) {
    const signature = createHmac('sha256', target.secret)
      .update(body)
      .digest('hex');
    headers['X-Aether-Signature'] = `sha256=${signature}`;
  }

  const start = Date.now();

  try {
    const response = await fetch(target.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    return {
      success: response.ok,
      statusCode: response.status,
      durationMs: Date.now() - start,
      attempt: 1,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: null,
      durationMs: Date.now() - start,
      attempt: 1,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Retry a failed webhook delivery with exponential back-off.
 *
 * Delay formula: baseDelay * 2^attempt  (with jitter)
 * Max retries: 5 (delays: ~1s, ~2s, ~4s, ~8s, ~16s)
 */
export async function retryWithBackoff(
  target: WebhookTarget,
  payload: unknown,
  attempt: number = 1,
): Promise<DeliveryResult> {
  if (attempt > MAX_RETRIES) {
    return {
      success: false,
      statusCode: null,
      durationMs: 0,
      attempt,
      error: `Max retries (${MAX_RETRIES}) exceeded`,
    };
  }

  // Exponential back-off with jitter
  const delay = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 500;
  await sleep(delay);

  const result = await dispatchWebhook(target, payload);
  result.attempt = attempt;

  if (result.success) return result;

  // Only retry on server errors or network failures
  if (result.statusCode !== null && result.statusCode < 500) {
    // 4xx errors are not retried (client error)
    return result;
  }

  return retryWithBackoff(target, payload, attempt + 1);
}

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a webhook's trigger conditions are met given the
 * current weather at the subscription's location.
 */
export function checkConditionMet(
  subscription: WebhookSubscription,
  currentWeather: CurrentWeather,
): boolean {
  const { conditions } = subscription;

  // Temperature thresholds
  if (conditions.tempBelow !== undefined && currentWeather.temp >= conditions.tempBelow) {
    return false;
  }

  if (conditions.tempAbove !== undefined && currentWeather.temp <= conditions.tempAbove) {
    return false;
  }

  // Wind threshold
  if (conditions.windAbove !== undefined && currentWeather.windSpeed <= conditions.windAbove) {
    return false;
  }

  // Precipitation probability threshold
  if (
    conditions.precipProbAbove !== undefined &&
    currentWeather.precipProb <= conditions.precipProbAbove
  ) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
