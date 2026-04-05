import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4011;

app.use(cors());
app.use(express.json());

// GET /v1/media/sky-camera?lat=30.83&lon=-83.28
app.get('/v1/media/sky-camera', (_req, res) => {
  res.json({
    data: {
      cameras: [],
      message: 'Sky camera network not yet available in this area.',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

// POST /v1/media/timelapse
app.post('/v1/media/timelapse', (_req, res) => {
  res.json({
    data: {
      status: 'queued',
      estimatedDuration: '2 minutes',
    },
    meta: { generatedAt: new Date().toISOString() },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'media-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER Media] Running on port ${PORT}`);
});

export default app;
