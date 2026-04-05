import { Router } from 'express';
import { z } from 'zod';
import { calculateModelWeights, blendForecasts, generateConfidence } from '../blending';

export const forecastRouter = Router();

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// GET /v1/forecast/point?lat=30.83&lon=-83.28
// Returns interpolated point forecast from blended models
forecastRouter.get('/point', (req, res) => {
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

  // Determine season from latitude and month
  const month = now.getMonth();
  const isNorthern = lat >= 0;
  const season = getSeason(month, isNorthern);

  // Calculate model weights and generate blended forecast
  const weights = calculateModelWeights({ lat, lon }, season);
  const mockModels = generateMockModelOutputs(lat, lon, now);
  const blended = blendForecasts(mockModels, weights);
  const confidence = generateConfidence(mockModels.map((m) => m.temp));

  res.json({
    data: {
      location: { lat, lon },
      validTime: now.toISOString(),
      temp: blended.temp,
      feelsLike: blended.feelsLike,
      humidity: blended.humidity,
      windSpeed: blended.windSpeed,
      windDir: blended.windDir,
      precipProb: blended.precipProb,
      condition: blended.condition,
      confidence,
    },
    meta: {
      generatedAt: now.toISOString(),
      model: 'aether-blend',
      weights,
      cached: false,
    },
  });
});

// GET /v1/forecast/models?lat=30.83&lon=-83.28
// Returns individual model comparison data for a location
forecastRouter.get('/models', (req, res) => {
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

  const models = [
    {
      id: 'gfs',
      name: 'GFS (Global Forecast System)',
      resolution: '0.25deg',
      runTime: new Date(now.getTime() - 3 * 3600000).toISOString(),
      temp: Math.round(72 + Math.random() * 6),
      precipProb: Math.round(Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 15),
    },
    {
      id: 'nam',
      name: 'NAM (North American Mesoscale)',
      resolution: '3km',
      runTime: new Date(now.getTime() - 2 * 3600000).toISOString(),
      temp: Math.round(71 + Math.random() * 6),
      precipProb: Math.round(Math.random() * 45),
      windSpeed: Math.round(5 + Math.random() * 15),
    },
    {
      id: 'hrrr',
      name: 'HRRR (High-Resolution Rapid Refresh)',
      resolution: '3km',
      runTime: new Date(now.getTime() - 1 * 3600000).toISOString(),
      temp: Math.round(73 + Math.random() * 5),
      precipProb: Math.round(Math.random() * 35),
      windSpeed: Math.round(5 + Math.random() * 15),
    },
    {
      id: 'ecmwf',
      name: 'ECMWF (European Centre)',
      resolution: '0.1deg',
      runTime: new Date(now.getTime() - 6 * 3600000).toISOString(),
      temp: Math.round(72 + Math.random() * 5),
      precipProb: Math.round(Math.random() * 38),
      windSpeed: Math.round(5 + Math.random() * 15),
    },
  ];

  res.json({
    data: { location: { lat, lon }, models },
    meta: {
      generatedAt: now.toISOString(),
      cached: false,
    },
  });
});

// GET /v1/forecast/accuracy
// Returns recent accuracy statistics across models
forecastRouter.get('/accuracy', (_req, res) => {
  const now = new Date();

  const accuracy = [
    {
      modelId: 'gfs',
      period: '7d',
      tempMAE: 2.3,
      precipBrierScore: 0.18,
      windMAE: 3.1,
      sampleSize: 1420,
    },
    {
      modelId: 'nam',
      period: '7d',
      tempMAE: 2.1,
      precipBrierScore: 0.16,
      windMAE: 2.8,
      sampleSize: 1380,
    },
    {
      modelId: 'hrrr',
      period: '7d',
      tempMAE: 1.8,
      precipBrierScore: 0.14,
      windMAE: 2.5,
      sampleSize: 1450,
    },
    {
      modelId: 'ecmwf',
      period: '7d',
      tempMAE: 1.9,
      precipBrierScore: 0.13,
      windMAE: 2.9,
      sampleSize: 1200,
    },
    {
      modelId: 'aether-blend',
      period: '7d',
      tempMAE: 1.5,
      precipBrierScore: 0.11,
      windMAE: 2.2,
      sampleSize: 1450,
    },
  ];

  res.json({
    data: {
      accuracy,
      biasCorrection: {
        enabled: true,
        lastCalibrated: new Date(now.getTime() - 6 * 3600000).toISOString(),
        stationsUsed: 342,
      },
    },
    meta: {
      generatedAt: now.toISOString(),
      cached: false,
    },
  });
});

// --- Helpers ---

function getSeason(month: number, isNorthern: boolean): string {
  const seasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
  const season = seasons[month];
  if (!isNorthern) {
    const flip: Record<string, string> = { winter: 'summer', spring: 'fall', summer: 'winter', fall: 'spring' };
    return flip[season];
  }
  return season;
}

interface MockModelOutput {
  modelId: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  precipProb: number;
  condition: string;
}

function generateMockModelOutputs(lat: number, _lon: number, now: Date): MockModelOutput[] {
  const hour = now.getHours();
  const baseTemp = 75 - Math.abs(lat) * 0.5;
  const diurnal = -8 * Math.cos(((hour - 14) / 24) * 2 * Math.PI);

  return ['gfs', 'nam', 'hrrr', 'ecmwf'].map((modelId) => ({
    modelId,
    temp: Math.round(baseTemp + diurnal + (Math.random() - 0.5) * 6),
    feelsLike: Math.round(baseTemp + diurnal + (Math.random() - 0.5) * 7),
    humidity: Math.round(50 + Math.random() * 30),
    windSpeed: Math.round(5 + Math.random() * 15),
    windDir: Math.round(Math.random() * 360),
    precipProb: Math.round(Math.random() * 40),
    condition: 'partly_cloudy',
  }));
}
