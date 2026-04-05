// ============================================================
// AETHER Cloudflare Worker — Edge Cache & Geo-Routing
// Deployed to 200+ PoPs worldwide
// ============================================================

interface Env {
  API_ORIGIN: string;
  RADAR_BUCKET: R2Bucket;
  CACHE_KV: KVNamespace;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Radar tile serving (from R2)
    if (path.startsWith('/v1/radar/tiles/')) {
      return handleRadarTile(request, env, corsHeaders);
    }

    // Cached API proxy
    if (path.startsWith('/v1/')) {
      return handleApiProxy(request, env, corsHeaders);
    }

    return new Response('AETHER Edge — Atmospheric Intelligence', {
      headers: { 'Content-Type': 'text/plain', ...corsHeaders },
    });
  },
};

async function handleRadarTile(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = url.pathname + url.search;

  // Check edge cache (5-min TTL)
  const cached = await env.CACHE_KV.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'HIT',
        ...corsHeaders,
      },
    });
  }

  // Fetch from R2
  const tileKey = url.pathname.replace('/v1/radar/tiles/', 'radar/');
  const object = await env.RADAR_BUCKET.get(tileKey);

  if (!object) {
    return new Response('Tile not found', { status: 404, headers: corsHeaders });
  }

  const response = new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/png',
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'MISS',
      ...corsHeaders,
    },
  });

  return response;
}

async function handleApiProxy(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = url.pathname + url.search;

  // Determine TTL based on endpoint
  const ttl = getCacheTtl(url.pathname);

  if (ttl > 0 && request.method === 'GET') {
    // Check edge cache
    const cached = await env.CACHE_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttl}`,
          'X-Cache': 'HIT',
          ...corsHeaders,
        },
      });
    }
  }

  // Forward to origin
  const originUrl = new URL(url.pathname + url.search, env.API_ORIGIN);
  const originResponse = await fetch(originUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined,
  });

  const responseBody = await originResponse.text();

  // Cache successful GET responses
  if (originResponse.ok && request.method === 'GET' && ttl > 0) {
    await env.CACHE_KV.put(cacheKey, responseBody, { expirationTtl: ttl });
  }

  return new Response(responseBody, {
    status: originResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': ttl > 0 ? `public, max-age=${ttl}` : 'no-cache',
      'X-Cache': 'MISS',
      ...corsHeaders,
    },
  });
}

function getCacheTtl(pathname: string): number {
  if (pathname.includes('/weather/current')) return 300;      // 5 min
  if (pathname.includes('/weather/hourly')) return 900;       // 15 min
  if (pathname.includes('/weather/daily')) return 1800;       // 30 min
  if (pathname.includes('/weather/minute')) return 60;        // 1 min
  if (pathname.includes('/weather/alerts')) return 60;        // 1 min
  if (pathname.includes('/aqi')) return 3600;                 // 1 hr
  if (pathname.includes('/pollen')) return 3600;              // 1 hr
  if (pathname.includes('/historical')) return 86400;         // 24 hr
  if (pathname.includes('/climate/normals')) return 604800;   // 7 days
  if (pathname.includes('/locations/search')) return 86400;   // 24 hr
  return 0; // Don't cache
}
