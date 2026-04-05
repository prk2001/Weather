import { useEffect, useState } from 'react';

// Local alert type — uses plain strings instead of enums for NWS API parsing
interface StormAlert {
  id: string;
  type: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  headline: string;
  description: string;
  instruction?: string;
  issued: Date;
  expires: Date;
  source: string;
}

interface StormTrackerProps {
  lat: number;
  lon: number;
  onClose: () => void;
}

interface HurricaneInfo {
  id: string;
  name: string;
  category: string;
  windSpeed: number;
  movement: string;
  pressure: number;
  location: string;
  advisory: string;
  timestamp: string;
}

// NWS alert severity colors
const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  extreme: { bg: 'rgba(127, 29, 29, 0.3)', border: '#f87171', text: '#fca5a5' },
  severe: { bg: 'rgba(153, 27, 27, 0.25)', border: '#f87171', text: '#fca5a5' },
  moderate: { bg: 'rgba(120, 53, 15, 0.25)', border: '#fb923c', text: '#fdba74' },
  minor: { bg: 'rgba(113, 63, 18, 0.2)', border: '#fbbf24', text: '#fde68a' },
};

const ALERT_ICONS: Record<string, string> = {
  'Tornado Warning': '🌪️',
  'Tornado Watch': '🌪️',
  'Severe Thunderstorm Warning': '⛈️',
  'Severe Thunderstorm Watch': '⛈️',
  'Flash Flood Warning': '🌊',
  'Flood Warning': '🌊',
  'Flood Watch': '🌊',
  'Hurricane Warning': '🌀',
  'Hurricane Watch': '🌀',
  'Tropical Storm Warning': '🌀',
  'Winter Storm Warning': '❄️',
  'Winter Storm Watch': '❄️',
  'Blizzard Warning': '🌨️',
  'Heat Advisory': '🌡️',
  'Excessive Heat Warning': '🌡️',
  'Wind Advisory': '💨',
  'High Wind Warning': '💨',
  'Dense Fog Advisory': '🌫️',
  'Freeze Warning': '🥶',
  'Frost Advisory': '🥶',
};

export function StormTracker({ lat, lon, onClose }: StormTrackerProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'regional' | 'hurricanes'>('alerts');
  const [localAlerts, setLocalAlerts] = useState<StormAlert[]>([]);
  const [regionalAlerts, setRegionalAlerts] = useState<StormAlert[]>([]);
  const [hurricanes, setHurricanes] = useState<HurricaneInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    // Fetch all data in parallel
    Promise.all([
      // Local alerts for user location
      fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
        headers: { 'User-Agent': 'AETHER/1.0', Accept: 'application/geo+json' },
      }).then(r => r.json()).catch(() => ({ features: [] })),

      // Regional alerts (broader area — entire state zone)
      fetch(`https://api.weather.gov/alerts/active?area=GA,FL,AL`, {
        headers: { 'User-Agent': 'AETHER/1.0', Accept: 'application/geo+json' },
      }).then(r => r.json()).catch(() => ({ features: [] })),

      // NHC active storms (Atlantic)
      fetch('https://api.weather.gov/alerts/active?event=Hurricane%20Warning,Hurricane%20Watch,Tropical%20Storm%20Warning,Tropical%20Storm%20Watch', {
        headers: { 'User-Agent': 'AETHER/1.0', Accept: 'application/geo+json' },
      }).then(r => r.json()).catch(() => ({ features: [] })),
    ]).then(([localData, regionalData, hurricaneData]) => {
      setLocalAlerts(parseAlerts(localData.features ?? []));
      setRegionalAlerts(parseAlerts(regionalData.features ?? []).slice(0, 20));

      // Parse hurricane alerts into HurricaneInfo
      const hurricaneAlerts = parseAlerts(hurricaneData.features ?? []);
      const uniqueHurricanes: HurricaneInfo[] = [];
      const seen = new Set<string>();
      for (const alert of hurricaneAlerts) {
        const name = extractStormName(alert.headline);
        if (name && !seen.has(name)) {
          seen.add(name);
          uniqueHurricanes.push({
            id: alert.id,
            name,
            category: alert.type.includes('Hurricane') ? 'Hurricane' : 'Tropical Storm',
            windSpeed: 0,
            movement: '',
            pressure: 0,
            location: alert.headline,
            advisory: alert.description.substring(0, 300),
            timestamp: new Date(alert.issued).toLocaleString(),
          });
        }
      }
      setHurricanes(uniqueHurricanes);
      setLoading(false);
    });
  }, [lat, lon]);

  const tabs = [
    { id: 'alerts' as const, label: 'Local Alerts', count: localAlerts.length },
    { id: 'regional' as const, label: 'Regional', count: regionalAlerts.length },
    { id: 'hurricanes' as const, label: 'Hurricanes', count: hurricanes.length },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn var(--duration-normal) var(--ease-out)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface-solid)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border)',
          maxWidth: '650px', width: '100%', maxHeight: '85vh', overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{'🛡️'} Storm Tracker</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Live NWS alerts, regional storms, and hurricane tracking
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '2px',
          padding: 'var(--space-2) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
                color: activeTab === tab.id ? '#0b1117' : 'var(--color-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700,
                  padding: '1px 5px', borderRadius: 'var(--radius-full)',
                  background: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : tab.count > 0 ? 'var(--color-severity-red)' : 'var(--color-text-muted)',
                  color: '#fff',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4) var(--space-5)' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              <div style={{ animation: 'pulse 1.5s ease infinite', fontSize: '1.5rem', marginBottom: '8px' }}>{'🛡️'}</div>
              Scanning for active weather threats...
            </div>
          )}

          {!loading && activeTab === 'alerts' && (
            <AlertsList
              alerts={localAlerts}
              expandedId={expandedAlert}
              onToggle={(id) => setExpandedAlert(expandedAlert === id ? null : id)}
              emptyMessage="No active weather alerts for your location. All clear! ✅"
            />
          )}

          {!loading && activeTab === 'regional' && (
            <AlertsList
              alerts={regionalAlerts}
              expandedId={expandedAlert}
              onToggle={(id) => setExpandedAlert(expandedAlert === id ? null : id)}
              emptyMessage="No active regional alerts for GA, FL, AL."
            />
          )}

          {!loading && activeTab === 'hurricanes' && (
            <HurricanePanel hurricanes={hurricanes} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.6rem', color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}>
          Data: NWS Weather Alerts API &middot; Updated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ── Alerts List ──────────────────────────────────────────────

function AlertsList({ alerts, expandedId, onToggle, emptyMessage }: {
  alerts: StormAlert[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  emptyMessage: string;
}) {
  if (alerts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {alerts.map((alert) => {
        const sev = SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.minor!;
        const icon = ALERT_ICONS[alert.type] ?? '⚠️';
        const isExpanded = expandedId === alert.id;

        return (
          <div key={alert.id}>
            <button
              onClick={() => onToggle(alert.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 14px',
                background: sev.bg,
                border: `1px solid ${sev.border}40`,
                borderRadius: isExpanded ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--color-text)',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}
            >
              <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: sev.text }}>
                  {alert.type}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {alert.headline.length > 100 ? alert.headline.substring(0, 100) + '...' : alert.headline}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '4px', fontFeatureSettings: "'tnum' on" }}>
                  Until {new Date(alert.expires).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                  {' · '}
                  {alert.severity.toUpperCase()}
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                {'▼'}
              </span>
            </button>

            {isExpanded && (
              <div style={{
                padding: '12px 14px',
                background: sev.bg,
                borderLeft: `1px solid ${sev.border}40`,
                borderRight: `1px solid ${sev.border}40`,
                borderBottom: `1px solid ${sev.border}40`,
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
                  {alert.description.length > 500 ? alert.description.substring(0, 500) + '...' : alert.description}
                </p>
                {alert.instruction && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.7rem',
                    color: '#fff', fontWeight: 600,
                  }}>
                    {'📋'} {alert.instruction.length > 300 ? alert.instruction.substring(0, 300) + '...' : alert.instruction}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Hurricane Panel ──────────────────────────────────────────

function HurricanePanel({ hurricanes }: { hurricanes: HurricaneInfo[] }) {
  if (hurricanes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{'🌊'}</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
          No active hurricanes or tropical storms
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
          Atlantic hurricane season: June 1 — November 30
        </div>

        {/* NHC link */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <a
            href="https://www.nhc.noaa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-accent)',
              fontSize: '0.75rem', fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {'🌀'} National Hurricane Center
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {hurricanes.map((h) => (
        <div
          key={h.id}
          style={{
            padding: '14px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>{'🌀'}</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{h.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-severity-red)' }}>{h.category}</div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {h.advisory}
          </p>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Last updated: {h.timestamp}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function parseAlerts(features: Record<string, unknown>[]): StormAlert[] {
  return features.map((f) => {
    const p = f.properties as Record<string, unknown>;
    return {
      id: (p.id as string) ?? `alert-${Math.random()}`,
      type: (p.event as string) ?? 'Weather Alert',
      severity: mapSev(p.severity as string),
      urgency: 'expected' as never,
      certainty: 'likely' as never,
      headline: (p.headline as string) ?? '',
      description: (p.description as string) ?? '',
      instruction: (p.instruction as string) ?? undefined,
      affectedZones: [],
      issued: new Date((p.onset as string) ?? Date.now()),
      expires: new Date((p.expires as string) ?? Date.now()),
      source: (p.senderName as string) ?? 'NWS',
    };
  });
}

function mapSev(s: string): 'extreme' | 'severe' | 'moderate' | 'minor' {
  switch (s?.toLowerCase()) {
    case 'extreme': return 'extreme';
    case 'severe': return 'severe';
    case 'moderate': return 'moderate';
    default: return 'minor';
  }
}

function extractStormName(headline: string): string | null {
  const match = headline.match(/(Hurricane|Tropical Storm|Tropical Depression)\s+(\w+)/i);
  return match ? `${match[1]} ${match[2]}` : null;
}
