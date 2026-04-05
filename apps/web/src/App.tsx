import { useWeatherStore } from './stores/weather';
import { MapBackground } from './components/map/MapBackground';
import type { MapControls } from './components/map/MapBackground';
import { WeatherOverlay } from './components/weather/WeatherOverlay';
import { BottomTimeline } from './components/weather/BottomTimeline';
import { AlertsBanner } from './components/weather/AlertsBanner';
import { LayerSidebar } from './components/layout/LayerSidebar';
import { TopBar } from './components/layout/TopBar';
import { PremiumModal } from './components/layout/PremiumModal';
import { DetailPanel } from './components/weather/DetailPanel';
import { TripPlanner } from './components/weather/TripPlanner';
import { StormTracker } from './components/weather/StormTracker';
import type { ForecastModel } from './components/weather/BottomTimeline';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useEffect, useState, useRef } from 'react';

export type ViewTab = 'basic' | 'hourly' | 'radar' | 'health' | 'activities';
export type MapLayer = 'wind' | 'temperature' | 'rain' | 'clouds' | 'satellite' | 'radar';

export function App() {
  const { current, hourly, daily, alerts, loading, error, fetchWeather } = useWeatherStore();
  useKeyboardShortcuts();
  const [activeTab, setActiveTab] = useState<ViewTab>('basic');
  const [activeLayer, setActiveLayer] = useState<MapLayer>('radar');
  const [activeModel, setActiveModel] = useState<ForecastModel>('blend');
  const [showPremium, setShowPremium] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [showStormTracker, setShowStormTracker] = useState(false);
  const mapControlsRef = useRef<MapControls | null>(null);

  useEffect(() => {
    // Default to Valdosta, GA — your location
    fetchWeather(30.8327, -83.2785);
  }, [fetchWeather]);

  const handleDayClick = (index: number) => {
    if (selectedDayIndex === index) {
      setSelectedDayIndex(null);
      setShowDetail(false);
    } else {
      setSelectedDayIndex(index);
      setShowDetail(true);
    }
  };

  // Real alerts from NWS (or empty if dismissed)
  const visibleAlerts = alertsDismissed ? [] : alerts;

  return (
    <div style={{ height: '100dvh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      {/* Full-bleed interactive map with real weather tiles */}
      <MapBackground
        layer={activeLayer}
        lat={current?.location.lat ?? 30.83}
        lon={current?.location.lon ?? -83.28}
        windSpeed={current?.windSpeed}
        windDir={current?.windDir}
        condition={current?.condition}
        mapControlsRef={mapControlsRef}
        onSpotForecast={(spotLat, spotLon) => {
          fetchWeather(spotLat, spotLon);
          setAlertsDismissed(false);
          setShowDetail(false);
          setSelectedDayIndex(null);
        }}
      />

      {/* Top bar: search + AETHER branding + premium CTA */}
      <TopBar
        onPremiumClick={() => setShowPremium(true)}
        onSearch={(lat, lon) => { fetchWeather(lat, lon); setAlertsDismissed(false); }}
        onTripClick={() => setShowTrip(true)}
      />

      {/* Real NWS weather alerts */}
      <AlertsBanner alerts={visibleAlerts} onDismiss={() => setAlertsDismissed(true)} />

      {/* AETHER weather overlay — our signature panel with action line + activity scores */}
      {current && !loading && (
        <WeatherOverlay
          conditions={current}
          daily={daily}
          hourly={hourly}
          onDayClick={handleDayClick}
          selectedDayIndex={selectedDayIndex}
        />
      )}

      {/* Layer selector sidebar */}
      <LayerSidebar activeLayer={activeLayer} onLayerChange={setActiveLayer} mapControls={mapControlsRef.current} />

      {/* Bottom hourly timeline with real NWS forecast data */}
      {hourly.length > 0 && (
        <BottomTimeline
          hourly={hourly}
          daily={daily}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeModel={activeModel}
          onModelChange={setActiveModel}
        />
      )}

      {/* Day detail panel — hourly drill-down */}
      {showDetail && selectedDayIndex !== null && (
        <DetailPanel
          day={daily[selectedDayIndex]}
          hourly={hourly}
          dayIndex={selectedDayIndex}
          onClose={() => { setShowDetail(false); setSelectedDayIndex(null); }}
        />
      )}

      {/* Trip weather planner */}
      {showTrip && <TripPlanner onClose={() => setShowTrip(false)} />}

      {/* Storm tracker / hurricane tracker / regional alerts */}
      {showStormTracker && current && (
        <StormTracker
          lat={current.location.lat}
          lon={current.location.lon}
          onClose={() => setShowStormTracker(false)}
        />
      )}

      {/* Storm tracker button — bottom left above wind compass */}
      <button
        onClick={() => setShowStormTracker(true)}
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '330px',
          left: 'var(--space-4)',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.7rem',
          fontFamily: 'inherit',
          fontWeight: 500,
        }}
      >
        {'🛡️'} Storm Tracker
        {alerts.length > 0 && (
          <span style={{
            fontSize: '0.55rem', fontWeight: 700,
            padding: '1px 5px', borderRadius: 'var(--radius-full)',
            background: 'var(--color-severity-red)', color: '#fff',
          }}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* Premium subscription modal */}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}

      {/* Loading overlay */}
      {loading && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 'var(--space-6) var(--space-8)',
            textAlign: 'center',
            zIndex: 30,
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)', animation: 'pulse 1.5s ease infinite' }}>
            ☁️
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Fetching live weather from NWS...
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !loading && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 'var(--space-6) var(--space-8)',
            textAlign: 'center',
            zIndex: 30,
            borderColor: 'var(--color-severity-red)',
          }}
        >
          <div style={{ fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
          <div style={{ color: 'var(--color-severity-red)', fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>
            {error}
          </div>
          <button
            onClick={() => fetchWeather(30.8327, -83.2785)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              color: 'white',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Data source + timestamp */}
      {current && (
        <div
          style={{
            position: 'absolute',
            bottom: '220px',
            right: 'var(--space-3)',
            zIndex: 10,
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'right',
            pointerEvents: 'none',
          }}
        >
          NWS Weather API · Observed {new Date(current.observedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          <br />
          Radar: RainViewer · © AETHER · Primoris Partners LLC
        </div>
      )}
    </div>
  );
}
