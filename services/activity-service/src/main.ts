import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 4007;

app.use(cors());
app.use(express.json());

// POST /v1/activity/score
app.post('/v1/activity/score', (req, res) => {
  const schema = z.object({
    activity: z.string(),
    lat: z.number(),
    lon: z.number(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  // TODO: Pull real forecast data and score with weather-core
  res.json({
    data: {
      activity: parsed.data.activity,
      score: 72,
      label: 'Good',
      factors: [
        { name: 'Temperature', value: '65°F', impact: 'positive', detail: 'Ideal range' },
        { name: 'Wind', value: '8 mph', impact: 'positive', detail: 'Light winds' },
        { name: 'Rain chance', value: '15%', impact: 'neutral', detail: 'Some risk' },
      ],
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/activity/best-window?activity=running&lat=30.83&lon=-83.28
app.get('/v1/activity/best-window', (req, res) => {
  const schema = z.object({
    activity: z.string(),
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    hours: z.coerce.number().optional().default(2),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  const now = new Date();
  res.json({
    data: {
      activity: parsed.data.activity,
      windows: [
        {
          start: new Date(now.getTime() + 3 * 3600000).toISOString(),
          end: new Date(now.getTime() + 5 * 3600000).toISOString(),
          score: 88,
          label: 'Great',
          confidence: 'high',
        },
        {
          start: new Date(now.getTime() + 24 * 3600000).toISOString(),
          end: new Date(now.getTime() + 26 * 3600000).toISOString(),
          score: 82,
          label: 'Great',
          confidence: 'medium',
        },
        {
          start: new Date(now.getTime() + 48 * 3600000).toISOString(),
          end: new Date(now.getTime() + 50 * 3600000).toISOString(),
          score: 75,
          label: 'Good',
          confidence: 'medium',
        },
      ],
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'activity-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER Activity] Running on port ${PORT}`);
});

export default app;
