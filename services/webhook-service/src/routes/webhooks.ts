import { Router } from 'express';
import { z } from 'zod';
import { dispatchWebhook, checkConditionMet } from '../dispatcher';

export const webhooksRouter = Router();

const createWebhookSchema = z.object({
  userId: z.string().min(1),
  url: z.string().url(),
  secret: z.string().min(16).optional(),
  events: z.array(z.enum([
    'alert.issued',
    'alert.updated',
    'alert.expired',
    'forecast.severe',
    'forecast.freeze',
    'forecast.heat',
    'condition.rain_start',
    'condition.rain_stop',
    'condition.snow_start',
  ])).min(1),
  conditions: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    radius: z.number().min(1).max(500).default(50),
    tempBelow: z.number().optional(),
    tempAbove: z.number().optional(),
    windAbove: z.number().optional(),
    precipProbAbove: z.number().min(0).max(100).optional(),
  }),
});

// In-memory store (will be replaced by database)
interface StoredWebhook {
  id: string;
  userId: string;
  url: string;
  secret: string | null;
  events: string[];
  conditions: z.infer<typeof createWebhookSchema>['conditions'];
  active: boolean;
  createdAt: string;
  lastTriggered: string | null;
  deliveryCount: number;
  failureCount: number;
}

const webhooks: StoredWebhook[] = [];

// POST /v1/webhooks
// Create a new webhook subscription
webhooksRouter.post('/', (req, res) => {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid webhook configuration',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const data = parsed.data;

  const webhook: StoredWebhook = {
    id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: data.userId,
    url: data.url,
    secret: data.secret ?? null,
    events: data.events,
    conditions: data.conditions,
    active: true,
    createdAt: new Date().toISOString(),
    lastTriggered: null,
    deliveryCount: 0,
    failureCount: 0,
  };

  webhooks.push(webhook);

  res.status(201).json({
    data: webhook,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});

// GET /v1/webhooks?userId=xxx
// List all webhooks for a user
webhooksRouter.get('/', (req, res) => {
  const userId = req.query.userId as string | undefined;

  if (!userId) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Missing userId',
      status: 400,
      detail: 'userId query parameter is required',
    });
    return;
  }

  const userWebhooks = webhooks.filter((w) => w.userId === userId);

  res.json({
    data: userWebhooks,
    meta: {
      generatedAt: new Date().toISOString(),
      total: userWebhooks.length,
    },
  });
});

// DELETE /v1/webhooks/:id
// Delete a webhook subscription
webhooksRouter.delete('/:id', (req, res) => {
  const idx = webhooks.findIndex((w) => w.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({
      type: 'https://aether.weather/errors/not-found',
      title: 'Webhook not found',
      status: 404,
      detail: `No webhook with id ${req.params.id}`,
    });
    return;
  }

  webhooks.splice(idx, 1);

  res.status(204).send();
});

// POST /v1/webhooks/test/:id
// Send a test delivery to a webhook endpoint
webhooksRouter.post('/test/:id', async (req, res) => {
  const webhook = webhooks.find((w) => w.id === req.params.id);
  if (!webhook) {
    res.status(404).json({
      type: 'https://aether.weather/errors/not-found',
      title: 'Webhook not found',
      status: 404,
      detail: `No webhook with id ${req.params.id}`,
    });
    return;
  }

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test delivery from AETHER webhook service',
      webhookId: webhook.id,
    },
  };

  const result = await dispatchWebhook(
    { url: webhook.url, secret: webhook.secret, id: webhook.id },
    testPayload,
  );

  res.json({
    data: {
      delivered: result.success,
      statusCode: result.statusCode,
      duration: result.durationMs,
      error: result.error ?? null,
    },
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});
