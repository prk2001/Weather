import type { HourlyForecast } from '@aether/shared';
import { scoreActivity, findBestWindows } from '@aether/weather-core';
import { useState } from 'react';

interface ActivityPanelProps {
  hourly: HourlyForecast[];
}

const ACTIVITIES = [
  { id: 'running', name: 'Running', icon: '\u{1F3C3}' },
  { id: 'cycling', name: 'Cycling', icon: '\u{1F6B4}' },
  { id: 'hiking', name: 'Hiking', icon: '\u{1F9D7}' },
  { id: 'golf', name: 'Golf', icon: '\u26F3' },
  { id: 'dog_walking', name: 'Dog Walking', icon: '\u{1F436}' },
  { id: 'photography', name: 'Photography', icon: '\u{1F4F7}' },
  { id: 'gardening', name: 'Gardening', icon: '\u{1F331}' },
  { id: 'grilling', name: 'Grilling', icon: '\u{1F525}' },
  { id: 'fishing', name: 'Fishing', icon: '\u{1F3A3}' },
  { id: 'stargazing', name: 'Stargazing', icon: '\u{1F320}' },
];

export function ActivityPanel({ hourly }: ActivityPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (hourly.length === 0) return null;

  const currentHour = hourly[0]!;

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
          marginBottom: 'var(--space-3)',
        }}
      >
        Activity Scores
      </h2>

      {/* Activity chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {ACTIVITIES.map(({ id, name, icon }) => {
          const score = scoreActivity(id, currentHour);
          const isSelected = selected === id;

          return (
            <button
              key={id}
              onClick={() => setSelected(isSelected ? null : id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: isSelected
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                background: isSelected ? 'var(--color-surface-elevated)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              <span>{icon}</span>
              <span>{name}</span>
              <ScoreBadge score={score.score} />
            </button>
          );
        })}
      </div>

      {/* Expanded detail for selected activity */}
      {selected && <ActivityDetail activityId={selected} hourly={hourly} />}
    </div>
  );
}

function ActivityDetail({
  activityId,
  hourly,
}: {
  activityId: string;
  hourly: HourlyForecast[];
}) {
  const currentScore = scoreActivity(activityId, hourly[0]!);
  const bestWindows = findBestWindows(activityId, hourly, 2, 3);

  return (
    <div
      style={{
        background: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
      }}
    >
      {/* Current score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: scoreColor(currentScore.score),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#fff',
          }}
        >
          {currentScore.score}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{currentScore.label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Current conditions
          </div>
        </div>
      </div>

      {/* Factors */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: 'var(--space-3)',
        }}
      >
        {currentScore.factors.map((factor, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {factorIcon(factor.impact)} {factor.name}
            </span>
            <span style={{ fontWeight: 500, fontFeatureSettings: "'tnum' on" }}>
              {factor.value}
            </span>
          </div>
        ))}
      </div>

      {/* Best windows */}
      {bestWindows.length > 0 && (
        <>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}
          >
            Best Times This Week
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {bestWindows.map((window, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: i === 0 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {window.window
                    ? formatWindow(window.window.start, window.window.end)
                    : 'N/A'}
                </span>
                <ScoreBadge score={window.score} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 'var(--radius-full)',
        background: scoreColor(score),
        color: '#fff',
        fontFeatureSettings: "'tnum' on",
        minWidth: '24px',
        textAlign: 'center',
      }}
    >
      {score}
    </span>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#84CC16';
  if (score >= 40) return '#EAB308';
  if (score >= 20) return '#F97316';
  return '#EF4444';
}

function factorIcon(impact: string): string {
  switch (impact) {
    case 'positive':
      return '\u2705';
    case 'neutral':
      return '\u{1F7F0}';
    case 'negative':
      return '\u26A0\uFE0F';
    case 'dealbreaker':
      return '\u274C';
    default:
      return '\u2022';
  }
}

function formatWindow(start: Date, end: Date): string {
  const dayStr = start.toLocaleDateString('en-US', { weekday: 'short' });
  const startStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: undefined,
    hour12: true,
  });
  const endStr = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: undefined,
    hour12: true,
  });
  return `${dayStr} ${startStr}\u2013${endStr}`;
}
