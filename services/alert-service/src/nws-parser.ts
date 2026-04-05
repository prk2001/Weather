/**
 * NWS CAP/ATOM feed parser for AETHER alert service.
 *
 * Parses Common Alerting Protocol (CAP) XML feeds from the National Weather
 * Service into structured WeatherAlert objects.  Handles severity mapping,
 * polygon extraction to GeoJSON, and point-in-polygon hit testing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertSeverity = 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: AlertSeverity;
  urgency: string;
  certainty: string;
  headline: string;
  description: string;
  instruction: string;
  onset: string;
  expires: string;
  senderName: string;
  areaDesc: string;
  polygon: GeoJSONPolygon | null;
}

// ---------------------------------------------------------------------------
// Feed parsing
// ---------------------------------------------------------------------------

/**
 * Parse a CAP/ATOM XML feed string into an array of WeatherAlert objects.
 *
 * In production this will use a proper XML parser (fast-xml-parser or similar).
 * The skeleton extracts entries with regex for now so the service can boot
 * without additional dependencies.
 */
export function parseCapFeed(xml: string): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const id = extractTag(entry, 'id') ?? `alert-${Date.now()}`;
    const event = extractTag(entry, 'cap:event') ?? extractTag(entry, 'event') ?? 'Unknown';
    const nwsSeverity = extractTag(entry, 'cap:severity') ?? extractTag(entry, 'severity') ?? '';
    const urgency = extractTag(entry, 'cap:urgency') ?? extractTag(entry, 'urgency') ?? 'Unknown';
    const certainty = extractTag(entry, 'cap:certainty') ?? extractTag(entry, 'certainty') ?? 'Unknown';
    const headline = extractTag(entry, 'cap:headline') ?? extractTag(entry, 'title') ?? '';
    const description = extractTag(entry, 'cap:description') ?? extractTag(entry, 'summary') ?? '';
    const instruction = extractTag(entry, 'cap:instruction') ?? '';
    const onset = extractTag(entry, 'cap:onset') ?? extractTag(entry, 'cap:effective') ?? '';
    const expires = extractTag(entry, 'cap:expires') ?? '';
    const senderName = extractTag(entry, 'cap:senderName') ?? 'NWS';
    const areaDesc = extractTag(entry, 'cap:areaDesc') ?? '';
    const rawPolygon = extractTag(entry, 'cap:polygon') ?? '';

    alerts.push({
      id,
      event,
      severity: parseSeverity(nwsSeverity),
      urgency,
      certainty,
      headline,
      description,
      instruction,
      onset,
      expires,
      senderName,
      areaDesc,
      polygon: rawPolygon ? parsePolygon(rawPolygon) : null,
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Severity mapping
// ---------------------------------------------------------------------------

/**
 * Map an NWS CAP severity string to the internal AlertSeverity enum.
 */
export function parseSeverity(nwsSeverity: string): AlertSeverity {
  const map: Record<string, AlertSeverity> = {
    Extreme: 'extreme',
    Severe: 'severe',
    Moderate: 'moderate',
    Minor: 'minor',
  };
  return map[nwsSeverity] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Polygon handling
// ---------------------------------------------------------------------------

/**
 * Parse a CAP polygon string ("lat,lon lat,lon ...") into a GeoJSON Polygon.
 * CAP uses "lat,lon" pairs separated by spaces.  GeoJSON expects [lon, lat].
 */
export function parsePolygon(capPolygon: string): GeoJSONPolygon {
  const pairs = capPolygon.trim().split(/\s+/);
  const coordinates = pairs.map((pair) => {
    const [lat, lon] = pair.split(',').map(Number);
    return [lon, lat]; // GeoJSON is [lon, lat]
  });

  // GeoJSON polygons must be closed
  if (
    coordinates.length > 0 &&
    (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1])
  ) {
    coordinates.push([...coordinates[0]]);
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

// ---------------------------------------------------------------------------
// Point-in-polygon
// ---------------------------------------------------------------------------

/**
 * Determine whether a point (lat, lon) falls inside a weather alert's polygon
 * using the ray-casting algorithm.
 */
export function isPointInAlert(lat: number, lon: number, alert: WeatherAlert): boolean {
  if (!alert.polygon) return false;

  const ring = alert.polygon.coordinates[0]; // outer ring
  return pointInRing(lon, lat, ring);
}

function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}
