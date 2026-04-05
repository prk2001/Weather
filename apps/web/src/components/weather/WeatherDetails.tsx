import type { CurrentConditions } from '@aether/shared';
import {
  degreesToCompass,
  beaufortForce,
  dewpointComfort,
  uvCategory,
  aqiCategory,
  fogProbability,
} from '@aether/weather-core';

interface WeatherDetailsProps {
  conditions: CurrentConditions;
}

export function WeatherDetails({ conditions }: WeatherDetailsProps) {
  const windCompass = degreesToCompass(conditions.windDir);
  const { force: beaufort, label: windLabel } = beaufortForce(conditions.windSpeed);
  const dpComfort = dewpointComfort(conditions.dewpoint);
  const uv = uvCategory(conditions.uvIndex);
  const fogProb = fogProbability(conditions.temp, conditions.dewpoint, conditions.windSpeed);
  const pressureInHg = (conditions.pressure / 33.8639).toFixed(2);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <h2
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 'var(--space-4)',
        }}
      >
        Conditions
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-4)',
        }}
      >
        {/* Wind */}
        <DetailCard
          label="Wind"
          primary={`${conditions.windSpeed} mph`}
          secondary={`${windCompass} (${conditions.windDir}\u00B0)`}
          detail={`${windLabel} \u00B7 Beaufort ${beaufort}`}
          extra={
            conditions.windGust
              ? `Gusts to ${conditions.windGust} mph`
              : undefined
          }
        />

        {/* Humidity & Dewpoint */}
        <DetailCard
          label="Humidity"
          primary={`${conditions.humidity}%`}
          secondary={`Dewpoint ${conditions.dewpoint}\u00B0F`}
          detail={`Comfort: ${dpComfort}`}
        />

        {/* Pressure */}
        <DetailCard
          label="Pressure"
          primary={`${pressureInHg} inHg`}
          secondary={`${conditions.pressure.toFixed(1)} mb`}
          detail={`Trend: ${conditions.pressureTrend}`}
          trendIcon={
            conditions.pressureTrend === 'rising'
              ? '\u2197\uFE0F'
              : conditions.pressureTrend === 'falling'
                ? '\u2198\uFE0F'
                : '\u2192'
          }
        />

        {/* UV Index */}
        <DetailCard
          label="UV Index"
          primary={`${conditions.uvIndex}`}
          secondary={uv.category.replace('_', ' ')}
          detail={
            conditions.uvIndex >= 6
              ? 'Sunscreen recommended'
              : conditions.uvIndex >= 3
                ? 'Moderate exposure'
                : 'Low risk'
          }
          accentColor={uv.color}
        />

        {/* Visibility */}
        <DetailCard
          label="Visibility"
          primary={`${conditions.visibility} mi`}
          detail={
            conditions.visibility >= 10
              ? 'Excellent'
              : conditions.visibility >= 5
                ? 'Good'
                : conditions.visibility >= 2
                  ? 'Fair'
                  : 'Poor'
          }
        />

        {/* Cloud Cover */}
        <DetailCard
          label="Cloud Cover"
          primary={`${conditions.cloudCover}%`}
          detail={
            conditions.cloudCover < 20
              ? 'Mostly clear'
              : conditions.cloudCover < 50
                ? 'Partly cloudy'
                : conditions.cloudCover < 80
                  ? 'Mostly cloudy'
                  : 'Overcast'
          }
        />

        {/* Fog probability */}
        {fogProb > 0 && (
          <DetailCard
            label="Fog Risk"
            primary={`${fogProb}%`}
            detail={
              fogProb >= 80
                ? 'Dense fog likely'
                : fogProb >= 50
                  ? 'Fog possible'
                  : 'Slight fog chance'
            }
          />
        )}

        {/* AQI */}
        {conditions.aqi && (
          <DetailCard
            label="Air Quality"
            primary={`${conditions.aqi.aqi}`}
            secondary={conditions.aqi.category.replace('_', ' ')}
            detail={`Dominant: ${conditions.aqi.dominantPollutant}`}
            accentColor={aqiCategory(conditions.aqi.aqi).color}
          />
        )}
      </div>
    </div>
  );
}

function DetailCard({
  label,
  primary,
  secondary,
  detail,
  extra,
  trendIcon,
  accentColor,
}: {
  label: string;
  primary: string;
  secondary?: string;
  detail?: string;
  extra?: string;
  trendIcon?: string;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 500,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          fontFeatureSettings: "'tnum' on",
          color: accentColor || 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {primary}
        {trendIcon && <span style={{ fontSize: '0.9rem' }}>{trendIcon}</span>}
      </span>
      {secondary && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          {secondary}
        </span>
      )}
      {detail && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{detail}</span>
      )}
      {extra && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {extra}
        </span>
      )}
    </div>
  );
}
