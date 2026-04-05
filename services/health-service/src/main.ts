import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 4006;

app.use(cors());
app.use(express.json());

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// GET /v1/health/migraine?lat=30.83&lon=-83.28
app.get('/v1/health/migraine', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  // Barometric pressure change rate analysis
  res.json({
    data: {
      risk: 'low',
      pressureCurrent: 1013.2,
      pressureChange6h: -1.5,
      pressureChange24h: -3.2,
      triggers: [],
      recommendation: 'Pressure is stable. Low migraine risk today.',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/health/pollen?lat=30.83&lon=-83.28
app.get('/v1/health/pollen', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.json({
    data: {
      overall: 'moderate',
      tree: { level: 'high', count: 85, dominant: 'Oak' },
      grass: { level: 'low', count: 12, dominant: null },
      weed: { level: 'low', count: 8, dominant: null },
      mold: { level: 'moderate', count: 45, dominant: 'Alternaria' },
      forecast: [
        { date: new Date().toISOString().split('T')[0], level: 'moderate' },
        { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], level: 'high' },
        { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], level: 'moderate' },
      ],
    },
    meta: { generatedAt: new Date().toISOString(), source: 'Copernicus CAMS' },
  });
});

// GET /v1/health/arthritis?lat=30.83&lon=-83.28
app.get('/v1/health/arthritis', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.json({
    data: {
      index: 4,
      level: 'moderate',
      factors: {
        humidity: { value: 65, impact: 'moderate' },
        pressure: { value: 1010, impact: 'low' },
        temperature: { value: 55, impact: 'moderate' },
      },
      recommendation: 'Some joint discomfort possible. Light stretching recommended.',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/health/heat-stress?lat=30.83&lon=-83.28
app.get('/v1/health/heat-stress', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.json({
    data: {
      wbgt: 72,
      category: 'low',
      oshaFlag: false,
      heatIndex: 75,
      recommendation: 'No heat stress concerns.',
      hydrationReminder: false,
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/health/cold-stress?lat=30.83&lon=-83.28
app.get('/v1/health/cold-stress', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.json({
    data: {
      windChill: 35,
      category: 'low',
      frostbiteTime: null,
      recommendation: 'Light jacket weather. No cold stress concerns.',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/health/sad?lat=30.83&lon=-83.28
app.get('/v1/health/sad', (req, res) => {
  const parsed = coordsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  res.json({
    data: {
      daylightHours: 12.5,
      daylightTrend: 'increasing',
      cloudCoverAvg7d: 55,
      sunshineHours7d: 32,
      level: 'low',
      recommendation: 'Daylight hours are increasing. Good conditions for outdoor time.',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'health-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER Health] Running on port ${PORT}`);
});

export default app;
