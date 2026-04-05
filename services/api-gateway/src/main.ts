import express from 'express';
import cors from 'cors';
import { weatherRouter } from './routes/weather';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/v1/weather', weatherRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.warn(`[AETHER API] Running on port ${PORT}`);
});

export default app;
