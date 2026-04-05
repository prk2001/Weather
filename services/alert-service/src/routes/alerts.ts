import { Router } from 'express';
import { z } from 'zod';
import { parseCapFeed, isPointInAlert } from '../nws-parser';
import type { WeatherAlert } from '../nws-parser';

export const alertsRouter = Router();

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const subscribeSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(500).default(50),
  severities: z.array(z.enum(['extreme', 'severe', 'moderate', 'minor', 'unknown'])).optional(),
  channels: z.array(z.enum(['push', 'email', 'webhook'])).min(1),
  email: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
});

// In-memory stores (will be replaced by database)
const mockAlerts: WeatherAlert[] = [];
const subscriptions: Array<z.infer<typeof subscribeSchema> & { id: string; createdAt: string }> = [];

// GET /v1/alerts/active?lat=30.83&lon=-83.28
// Returns active weather alerts affecting the given point
alertsRouter.get('/active', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid coordinates',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const { lat, lon } = parsed.data;

  // Filter alerts that contain this point
  const activeAlerts = mockAlerts.filter((alert) =>
    isPointInAlert(lat, lon, alert),
  );

  res.json({
    data: activeAlerts,
    meta: {
      generatedAt: new Date().toISOString(),
      totalActive: activeAlerts.length,
      cached: false,
    },
  });
});

// GET /v1/alerts/history?lat=30.83&lon=-83.28
// Returns recent historical alerts for a location
alertsRouter.get('/history', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid coordinates',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const { lat, lon } = parsed.data;
  const now = new Date();

  // Mock historical alerts
  const history = [
    {
      id: 'hist-001',
      event: 'Severe Thunderstorm Warning',
      severity: 'severe',
      onset: new Date(now.getTime() - 48 * 3600000).toISOString(),
      expires: new Date(now.getTime() - 46 * 3600000).toISOString(),
      verified: true,
    },
    {
      id: 'hist-002',
      event: 'Heat Advisory',
      severity: 'moderate',
      onset: new Date(now.getTime() - 72 * 3600000).toISOString(),
      expires: new Date(now.getTime() - 60 * 3600000).toISOString(),
      verified: true,
    },
  ];

  res.json({
    data: { location: { lat, lon }, history },
    meta: {
      generatedAt: now.toISOString(),
      cached: false,
    },
  });
});

// POST /v1/alerts/subscribe
// Subscribe to weather alerts for a location
alertsRouter.post('/subscribe', (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid subscription data',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const subscription = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  subscriptions.push(subscription);

  res.status(201).json({
    data: subscription,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});
