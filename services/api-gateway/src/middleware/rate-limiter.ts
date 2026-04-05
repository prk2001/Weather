import type { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter for development
// TODO: Replace with Redis sliding window in production
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_MINUTE = 60; // Development limit

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  // Skip health checks
  if (req.path === '/health') {
    next();
    return;
  }

  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', MAX_PER_MINUTE);
    res.setHeader('X-RateLimit-Remaining', MAX_PER_MINUTE - 1);
    next();
    return;
  }

  entry.count++;

  if (entry.count > MAX_PER_MINUTE) {
    res.status(429).json({
      type: 'https://aether.weather/errors/rate-limit',
      title: 'Rate Limit Exceeded',
      status: 429,
      detail: `Maximum ${MAX_PER_MINUTE} requests per minute`,
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', MAX_PER_MINUTE);
  res.setHeader('X-RateLimit-Remaining', MAX_PER_MINUTE - entry.count);
  next();
}
