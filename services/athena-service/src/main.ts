import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 4010;

app.use(cors());
app.use(express.json());

// ── Natural Language Query ───────────────────────────────────

const querySchema = z.object({
  query: z.string().min(1).max(500),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tone: z.enum(['straight_facts', 'gentle_nudge', 'adventure_guide', 'farmers_wisdom', 'scientific_precision']).optional(),
});

app.post('/v1/athena/query', async (req, res) => {
  const parsed = querySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      type: 'https://aether.weather/errors/validation',
      title: 'Invalid query',
      status: 400,
      detail: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const { query, lat, lon, tone } = parsed.data;

  // Intent detection
  const intent = detectIntent(query);

  // Generate response based on intent
  const response = await generateResponse(intent, query, lat, lon, tone || 'straight_facts');

  res.json({
    data: {
      query,
      intent: intent.type,
      response: response.text,
      confidence: response.confidence,
      sources: response.sources,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      model: 'athena-v1',
    },
  });
});

// ── Pattern Recognition ──────────────────────────────────────

app.get('/v1/athena/patterns', (_req, res) => {
  // TODO: Implement user-specific pattern detection
  res.json({
    data: {
      routines: [
        { type: 'morning_check', time: '7:00 AM', frequency: 'daily', confidence: 0.85 },
        { type: 'evening_check', time: '6:30 PM', frequency: 'weekdays', confidence: 0.72 },
      ],
      preferences: {
        comfortRange: { min: 62, max: 78 },
        rainSensitivity: 'high',
        preferredActivities: ['running', 'photography'],
      },
      insights: [
        'You tend to check weather before running — shall I send activity alerts?',
        'You prefer morning runs when temp is 55-65°F',
      ],
    },
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});

// ── Predictive Coaching ──────────────────────────────────────

app.get('/v1/athena/coaching', (_req, res) => {
  res.json({
    data: {
      suggestions: [
        {
          type: 'activity',
          message: 'Based on your running patterns, tomorrow morning looks ideal — 58°F, clear, light winds.',
          action: 'view_activity_window',
          priority: 'medium',
        },
        {
          type: 'preparation',
          message: 'Rain expected Thursday. Last time similar conditions hit, you wished you had an umbrella.',
          action: 'set_reminder',
          priority: 'low',
        },
      ],
    },
    meta: {
      generatedAt: new Date().toISOString(),
    },
  });
});

// ── Health check ─────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'athena-service', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`[AETHER Athena] Running on port ${PORT}`);
});

// ── Intent Detection ─────────────────────────────────────────

interface Intent {
  type: 'current_weather' | 'forecast' | 'comparison' | 'activity' | 'historical' | 'explanation' | 'unknown';
  entities: Record<string, string>;
}

function detectIntent(query: string): Intent {
  const q = query.toLowerCase();

  if (q.includes('right now') || q.includes('current') || q.includes('outside')) {
    return { type: 'current_weather', entities: {} };
  }
  if (q.includes('tomorrow') || q.includes('this week') || q.includes('forecast') || q.includes('will it')) {
    return { type: 'forecast', entities: {} };
  }
  if (q.includes('compare') || q.includes('vs') || q.includes('better')) {
    return { type: 'comparison', entities: {} };
  }
  if (q.includes('run') || q.includes('hike') || q.includes('golf') || q.includes('activity') || q.includes('should i')) {
    return { type: 'activity', entities: {} };
  }
  if (q.includes('last year') || q.includes('record') || q.includes('history') || q.includes('average')) {
    return { type: 'historical', entities: {} };
  }
  if (q.includes('why') || q.includes('what is') || q.includes('explain') || q.includes('how does')) {
    return { type: 'explanation', entities: {} };
  }

  return { type: 'unknown', entities: {} };
}

// ── Response Generation ──────────────────────────────────────

interface AthenaResponse {
  text: string;
  confidence: number;
  sources: string[];
}

async function generateResponse(
  intent: Intent,
  query: string,
  _lat: number,
  _lon: number,
  tone: string,
): Promise<AthenaResponse> {
  // TODO: Integrate Claude API for natural language generation
  // For now, template-based responses

  const responses: Record<string, string> = {
    current_weather: tone === 'adventure_guide'
      ? "Right now it's looking like a solid day out there. Mild temps, manageable wind."
      : "Current conditions show moderate temperatures with light winds.",
    forecast: tone === 'farmers_wisdom'
      ? "The almanac says the next few days look changeable. Keep an eye on the sky."
      : "The forecast shows variable conditions over the next few days.",
    activity: tone === 'adventure_guide'
      ? "Conditions are looking decent for outdoor activities. Check your activity scores for specifics."
      : "Activity conditions vary. Check the activity panel for detailed scoring.",
    comparison: "Weather comparison data is available in the forecast view.",
    historical: "Historical data is available for Pro subscribers and above.",
    explanation: "I can help explain weather phenomena. What specifically would you like to know?",
    unknown: "I'm not sure I understood that. Try asking about current weather, forecasts, or activities.",
  };

  return {
    text: responses[intent.type] || responses.unknown!,
    confidence: intent.type === 'unknown' ? 0.3 : 0.8,
    sources: ['mock-data'],
  };
}

export default app;
