import express from 'express';
import cors from 'cors';
import { reportsRouter } from './routes/reports';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = process.env.PORT || 4003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'aether-crowdsource-service',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/v1/reports', reportsRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.warn(`[AETHER Crowdsource] Running on port ${PORT}`);
});

export default app;
