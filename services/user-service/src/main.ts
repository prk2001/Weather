import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 4008;

app.use(cors());
app.use(express.json());

// GET /v1/user/profile
app.get('/v1/user/profile', (_req, res) => {
  // TODO: Auth middleware (Clerk JWT)
  res.json({
    data: {
      id: 'user_mock_001',
      email: 'dev@aether.weather',
      name: 'Developer',
      tier: 'premium',
      preferences: {
        units: { temp: 'F', wind: 'mph', pressure: 'inHg', precip: 'in', distance: 'mi' },
        tone: 'straight_facts',
        theme: 'auto',
        reducedMotion: false,
        simpleMode: false,
        language: 'en',
        timezone: 'America/New_York',
      },
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// PUT /v1/user/preferences
app.put('/v1/user/preferences', (req, res) => {
  const schema = z.object({
    tone: z.string().optional(),
    theme: z.string().optional(),
    reducedMotion: z.boolean().optional(),
    simpleMode: z.boolean().optional(),
    language: z.string().optional(),
    units: z.object({
      temp: z.string().optional(),
      wind: z.string().optional(),
      pressure: z.string().optional(),
      precip: z.string().optional(),
      distance: z.string().optional(),
    }).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.json({ data: { updated: true, preferences: parsed.data }, meta: { generatedAt: new Date().toISOString() } });
});

// POST /v1/user/locations
app.post('/v1/user/locations', (req, res) => {
  const schema = z.object({
    lat: z.number(),
    lon: z.number(),
    name: z.string(),
    nickname: z.string().optional(),
    isPrimary: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.status(201).json({
    data: { id: `loc_${Date.now()}`, ...parsed.data, sortOrder: 0 },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/user/locations
app.get('/v1/user/locations', (_req, res) => {
  res.json({
    data: [
      { id: 'loc_1', lat: 30.8327, lon: -83.2785, name: 'Valdosta, GA', isPrimary: true, sortOrder: 0 },
    ],
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/user/weather-wins
app.get('/v1/user/weather-wins', (_req, res) => {
  res.json({
    data: {
      thisWeek: 3,
      wins: [
        { type: 'dodged_rain', timestamp: new Date().toISOString(), description: 'Left work 10 min before downpour' },
        { type: 'found_window', timestamp: new Date().toISOString(), description: 'Perfect 2-hour running window Wednesday' },
        { type: 'accurate_forecast', timestamp: new Date().toISOString(), description: 'Forecast was within 2°F all week' },
      ],
      streak: 5,
      totalAllTime: 47,
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER User] Running on port ${PORT}`);
});

export default app;
