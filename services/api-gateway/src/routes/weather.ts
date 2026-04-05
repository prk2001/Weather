import { Router } from 'express';
import { z } from 'zod';

export const weatherRouter = Router();

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// GET /v1/weather/current?lat=30.83&lon=-83.28
weatherRouter.get('/current', (req, res) => {
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

  // TODO: Replace with real forecast service call
  // For now, return mock data
  const now = new Date();
  const hour = now.getHours();
  const baseTemp = 75 - Math.abs(lat) * 0.5;
  const diurnal = -8 * Math.cos(((hour - 14) / 24) * 2 * Math.PI);
  const temp = Math.round(baseTemp + diurnal);

  res.json({
    data: {
      location: { lat, lon },
      observedAt: now.toISOString(),
      temp,
      feelsLike: temp,
      humidity: 55,
      dewpoint: 52,
      pressure: 1013.25,
      pressureTrend: 'steady',
      windSpeed: 8,
      windDir: 225,
      visibility: 10,
      cloudCover: 30,
      condition: 'partly_cloudy',
      precipType: 'none',
      uvIndex: hour >= 6 && hour <= 18 ? 5 : 0,
    },
    meta: {
      generatedAt: now.toISOString(),
      model: 'mock',
      confidence: 'high',
      cached: false,
    },
  });
});

// GET /v1/weather/hourly?lat=30.83&lon=-83.28
weatherRouter.get('/hourly', (req, res) => {
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
  const hours = Array.from({ length: 48 }, (_, i) => {
    const time = new Date(now.getTime() + i * 3600000);
    const hour = time.getHours();
    const baseTemp = 75 - Math.abs(lat) * 0.5;
    const diurnal = -8 * Math.cos(((hour - 14) / 24) * 2 * Math.PI);
    return {
      time: time.toISOString(),
      temp: Math.round(baseTemp + diurnal + (Math.random() - 0.5) * 5),
      precipProb: Math.round(Math.random() * 40),
      condition: 'partly_cloudy',
    };
  });

  res.json({
    data: hours,
    meta: {
      generatedAt: now.toISOString(),
      model: 'mock',
      cached: false,
    },
  });
});

// GET /v1/weather/daily?lat=30.83&lon=-83.28
weatherRouter.get('/daily', (req, res) => {
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
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now.getTime() + i * 86400000);
    const baseTemp = 75 - Math.abs(lat) * 0.5;
    return {
      date: date.toISOString().split('T')[0],
      tempHigh: Math.round(baseTemp + Math.random() * 8),
      tempLow: Math.round(baseTemp - 15 + Math.random() * 5),
      precipProb: Math.round(Math.random() * 50),
      condition: 'partly_cloudy',
    };
  });

  res.json({
    data: days,
    meta: {
      generatedAt: now.toISOString(),
      model: 'mock',
      cached: false,
    },
  });
});

// GET /v1/weather/alerts?lat=30.83&lon=-83.28
weatherRouter.get('/alerts', (req, res) => {
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

  // No active alerts in mock mode
  res.json({
    data: [],
    meta: {
      generatedAt: new Date().toISOString(),
      cached: false,
    },
  });
});
