import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4009;

app.use(cors());
app.use(express.json());

// GET /v1/analytics/accuracy
app.get('/v1/analytics/accuracy', (_req, res) => {
  res.json({
    data: {
      period: '30d',
      metrics: {
        tempMAE: 2.3,
        tempBias: -0.4,
        precipPOD: 0.87,
        precipFAR: 0.18,
        precipCSI: 0.72,
      },
      byModel: {
        gfs: { tempMAE: 3.1, precipPOD: 0.82 },
        hrrr: { tempMAE: 1.8, precipPOD: 0.91 },
        nam: { tempMAE: 2.8, precipPOD: 0.85 },
        ecmwf: { tempMAE: 2.1, precipPOD: 0.89 },
        blended: { tempMAE: 2.3, precipPOD: 0.87 },
      },
      trend: 'improving',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// GET /v1/analytics/engagement
app.get('/v1/analytics/engagement', (_req, res) => {
  res.json({
    data: {
      dau: 1250,
      mau: 8400,
      dauMauRatio: 0.149,
      avgSessionDuration: 45,
      sessionsPerDAU: 2.8,
      notificationTapRate: 0.32,
      featureUsage: {
        hourlyTimeline: 0.89,
        radar: 0.72,
        activityScores: 0.45,
        timeTravelSlider: 0.38,
        keyboardShortcuts: 0.12,
      },
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// POST /v1/analytics/event
app.post('/v1/analytics/event', (req, res) => {
  // TODO: Forward to Mixpanel/Amplitude
  res.status(202).json({ status: 'accepted' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'analytics-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER Analytics] Running on port ${PORT}`);
});

export default app;
