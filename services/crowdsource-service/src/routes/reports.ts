import { Router } from 'express';
import { z } from 'zod';
import { verifyReport, calculateReputation } from '../verification';

export const reportsRouter = Router();

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const nearbySchema = coordsSchema.extend({
  radius: z.coerce.number().min(0.1).max(100).default(10), // km
});

const reportSchema = z.object({
  userId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  condition: z.enum([
    'clear',
    'partly_cloudy',
    'cloudy',
    'rain_light',
    'rain_heavy',
    'thunderstorm',
    'snow_light',
    'snow_heavy',
    'ice',
    'fog',
    'hail',
    'tornado',
    'other',
  ]),
  temp: z.number().min(-80).max(140).optional(),
  windSpeed: z.number().min(0).max(300).optional(),
  note: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
});

// In-memory store (will be replaced by database)
interface StoredReport {
  id: string;
  userId: string;
  lat: number;
  lon: number;
  condition: string;
  temp?: number;
  windSpeed?: number;
  note?: string;
  photoUrl?: string;
  verified: boolean;
  confidence: number;
  createdAt: string;
}

const reports: StoredReport[] = [];

// POST /v1/reports
// Submit a crowd-sourced weather report
reportsRouter.post('/', (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid report data',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const data = parsed.data;

  // Run verification against radar and nearby reports
  const nearbyReports = getReportsNearby(data.lat, data.lon, 10);
  const verification = verifyReport(
    { condition: data.condition, temp: data.temp, lat: data.lat, lon: data.lon },
    null, // radar data placeholder
    nearbyReports.map((r) => ({ condition: r.condition, temp: r.temp })),
  );

  const report: StoredReport = {
    id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...data,
    verified: verification.verified,
    confidence: verification.confidence,
    createdAt: new Date().toISOString(),
  };

  reports.push(report);

  // Calculate updated reputation
  const userReports = reports.filter((r) => r.userId === data.userId);
  const verifiedCount = userReports.filter((r) => r.verified).length;
  const reputation = calculateReputation(
    { id: data.userId, totalReports: userReports.length },
    verifiedCount,
  );

  res.status(201).json({
    data: {
      report,
      reputation,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      verification,
    },
  });
});

// GET /v1/reports/nearby?lat=30.83&lon=-83.28&radius=10
// Returns recent reports within a radius (km) of a point
reportsRouter.get('/nearby', (req, res) => {
  const parsed = nearbySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid parameters',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const { lat, lon, radius } = parsed.data;
  const nearby = getReportsNearby(lat, lon, radius);

  res.json({
    data: nearby,
    meta: {
      generatedAt: new Date().toISOString(),
      radius,
      total: nearby.length,
      cached: false,
    },
  });
});

// GET /v1/reports/user/:id
// Returns all reports submitted by a user
reportsRouter.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const userReports = reports.filter((r) => r.userId === userId);
  const verifiedCount = userReports.filter((r) => r.verified).length;

  const reputation = calculateReputation(
    { id: userId, totalReports: userReports.length },
    verifiedCount,
  );

  res.json({
    data: {
      reports: userReports,
      reputation,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      total: userReports.length,
    },
  });
});

// --- Helpers ---

function getReportsNearby(lat: number, lon: number, radiusKm: number): StoredReport[] {
  const maxAgeMs = 6 * 3600000; // 6 hours
  const now = Date.now();

  return reports.filter((r) => {
    const age = now - new Date(r.createdAt).getTime();
    if (age > maxAgeMs) return false;

    const dist = haversineKm(lat, lon, r.lat, r.lon);
    return dist <= radiusKm;
  });
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
