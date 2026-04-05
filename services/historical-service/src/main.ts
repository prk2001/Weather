import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

const coordsDateSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /v1/historical/day?lat=30.83&lon=-83.28&date=2025-03-30
app.get('/v1/historical/day', (req, res) => {
  const parsed = coordsDateSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  const { lat, lon, date } = parsed.data;

  // Mock historical data
  res.json({
    data: {
      date,
      location: { lat, lon },
      tempHigh: 72,
      tempLow: 48,
      precip: 0.12,
      condition: 'partly_cloudy',
      windSpeed: 8,
      source: 'NOAA ISD',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/historical/normals?lat=30.83&lon=-83.28&month=3
app.get('/v1/historical/normals', (req, res) => {
  const schema = z.object({
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    month: z.coerce.number().min(1).max(12),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ type: 'validation_error', detail: parsed.error.message });
    return;
  }

  // 30-year climate normals (mock)
  res.json({
    data: {
      month: parsed.data.month,
      tempHighAvg: 75,
      tempLowAvg: 52,
      precipAvg: 3.8,
      snowAvg: 0,
      recordHigh: { value: 95, year: 2019 },
      recordLow: { value: 22, year: 1993 },
    },
    meta: { generatedAt: new Date().toISOString(), period: '1991-2020' },
  });
});

// GET /v1/historical/records?lat=30.83&lon=-83.28&date=03-30
app.get('/v1/historical/records', (req, res) => {
  res.json({
    data: {
      recordHigh: { value: 92, year: 2017 },
      recordLow: { value: 28, year: 1987 },
      recordPrecip: { value: 2.5, year: 2005 },
      recordSnow: { value: 0, year: null },
      averageHigh: 75,
      averageLow: 51,
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/historical/departure?lat=30.83&lon=-83.28
app.get('/v1/historical/departure', (req, res) => {
  res.json({
    data: {
      currentTemp: 68,
      normalTemp: 75,
      departure: -7,
      trend: 'Spring arriving approximately on schedule',
      cumulativeGDD: 245,
      normalGDD: 280,
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'historical-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER Historical] Running on port ${PORT}`);
});

export default app;
