import type { CurrentConditions } from '@aether/shared';
import { degreesToCompass, roundTemp } from '@aether/weather-core';
import { tempFontWeight, dewpointComfort, beaufortForce } from '@aether/weather-core';
import { THRESHOLDS } from '@aether/shared';

interface WeatherCardProps {
  conditions: CurrentConditions;
}

export function WeatherCard({ conditions }: WeatherCardProps) {
  const temp = roundTemp(conditions.temp);
  const feelsLike = roundTemp(conditions.feelsLike);
  const showFeelsLike = Math.abs(conditions.temp - conditions.feelsLike) >= THRESHOLDS.feelsLikeDelta;
  const windCompass = degreesToCompass(conditions.windDir);
  const { label: windLabel } = beaufortForce(conditions.windSpeed);
  const dpComfort = dewpointComfort(conditions.dewpoint);
  const fontWeight = tempFontWeight(conditions.temp);

  const conditionDisplay = conditions.condition
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const actionLine = generateActionLine(conditions);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}
    >
      {/* Temperature */}
      <div
        style={{
          fontSize: '6rem',
          fontWeight,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontFeatureSettings: "'tnum' on",
          transition: 'font-weight var(--duration-normal) var(--ease-out)',
        }}
      >
        {temp}°
      </div>

      {/* Feels Like */}
      {showFeelsLike && (
        <div
          style={{
            fontSize: 'var(--space-4)',
            color: 'var(--color-text-secondary)',
            marginTop: 'calc(var(--space-2) * -1)',
          }}
        >
          Feels like {feelsLike}°
        </div>
      )}

      {/* Condition */}
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 500,
          color: 'var(--color-text)',
        }}
      >
        {conditionDisplay}
      </div>

      {/* Action Line */}
      <div
        style={{
          fontSize: '0.9rem',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          fontStyle: 'italic',
          maxWidth: '360px',
        }}
      >
        {actionLine}
      </div>

      {/* Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-4)',
          width: '100%',
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <DetailItem label="Wind" value={`${conditions.windSpeed} mph ${windCompass}`} detail={windLabel} />
        <DetailItem label="Humidity" value={`${conditions.humidity}%`} detail={`Dew ${conditions.dewpoint}° (${dpComfort})`} />
        <DetailItem label="Visibility" value={`${conditions.visibility} mi`} />
        <DetailItem label="Pressure" value={`${(conditions.pressure / 33.8639).toFixed(2)} inHg`} detail={conditions.pressureTrend} />
        <DetailItem label="UV Index" value={`${conditions.uvIndex}`} />
        <DetailItem label="Cloud Cover" value={`${conditions.cloudCover}%`} />
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{value}</div>
      {detail && (
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
          {detail}
        </div>
      )}
    </div>
  );
}

function generateActionLine(conditions: CurrentConditions): string {
  const { temp, precipType, windSpeed, uvIndex, condition } = conditions;

  if (condition === 'thunderstorm' || condition === 'severe_thunderstorm') {
    return 'Stay indoors. Thunderstorms in the area.';
  }
  if (precipType === 'rain' || condition === 'rain' || condition === 'heavy_rain') {
    return 'Grab an umbrella before heading out.';
  }
  if (precipType === 'snow' || condition === 'snow' || condition === 'heavy_snow') {
    return 'Bundle up — snow is falling.';
  }
  if (temp >= 100) {
    return 'Dangerously hot. Limit outdoor exposure and hydrate.';
  }
  if (temp >= 90) {
    return 'Hot day ahead. Stay hydrated and find shade.';
  }
  if (temp <= 20) {
    return 'Bitter cold. Dress in layers and limit exposure.';
  }
  if (temp <= 32) {
    return 'Below freezing. Watch for ice on roads.';
  }
  if (windSpeed >= 25) {
    return 'Very windy. Secure loose items outside.';
  }
  if (uvIndex >= 8) {
    return 'UV is very high. Sunscreen and shade recommended.';
  }
  if (temp >= 65 && temp <= 80 && condition === 'clear') {
    return 'Perfect weather. Get outside and enjoy it.';
  }
  if (condition === 'clear' || condition === 'partly_cloudy') {
    return 'Nice conditions for outdoor activities.';
  }
  return 'Check the hourly forecast for the best window today.';
}
