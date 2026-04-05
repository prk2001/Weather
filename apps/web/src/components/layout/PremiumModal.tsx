interface PremiumModalProps {
  onClose: () => void;
}

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#64748B',
    current: true,
    features: [
      '24-hour forecast',
      '7-day outlook',
      '1 saved location',
      '3 activity profiles',
      'Basic radar',
      'Standard notifications',
      'Community support',
    ],
    cta: 'Current Plan',
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/month',
    yearly: '$39.99/year (save 33%)',
    color: '#2dd4bf',
    popular: true,
    features: [
      '48-hour hourly forecast',
      '14-day daily forecast',
      '10 saved locations',
      '15 activity profiles',
      'All radar modes',
      'Historical data access',
      'Ad-free experience',
      'Smart home webhooks',
      '5 forecast tones',
      'Offline 24hr cache',
      'Email support (48hr)',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    yearly: '$79.99/year (save 33%)',
    color: '#D4A853',
    features: [
      'Everything in Pro, plus:',
      '14-day hourly forecast',
      '50 saved locations',
      'All 50+ activity profiles',
      'Health integrations',
      'Minute-by-minute precip',
      'Weather Wins analytics',
      'Athena AI unlimited',
      'SMS severe alerts',
      'Family sharing (5)',
      'Offline 48hr cache',
      'Data export (JSON/CSV)',
      'Live Activities (iOS)',
      'Priority support (4hr)',
    ],
    cta: 'Go Premium',
  },
];

export function PremiumModal({ onClose }: PremiumModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: 'var(--space-6) var(--space-6) var(--space-4)',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            AETHER PREMIUM
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Unlock the full power of weather intelligence
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            Get hyperlocal forecasts, AI coaching, health integrations, and 50+ activity profiles. 30-day free trial on Pro.
          </p>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 'var(--space-4)',
              right: 'var(--space-4)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: 'var(--space-1)',
            }}
          >
            &times;
          </button>
        </div>

        {/* Tier cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
        }}>
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                borderRadius: 'var(--radius-xl)',
                border: tier.popular
                  ? `2px solid ${tier.color}`
                  : '1px solid var(--color-border)',
                padding: 'var(--space-5)',
                position: 'relative',
                background: tier.popular
                  ? 'rgba(45, 212, 191, 0.05)'
                  : 'transparent',
              }}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: tier.color,
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '2px 12px',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  Most Popular
                </div>
              )}

              {/* Tier name */}
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
                {tier.name}
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: 'var(--space-1)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, fontFeatureSettings: "'tnum' on" }}>{tier.price}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tier.period}</span>
              </div>
              {tier.yearly && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                  or {tier.yearly}
                </div>
              )}

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {tier.features.map((feature, i) => (
                  <li key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                    <span style={{ color: tier.color, fontSize: '0.7rem', marginTop: '2px' }}>&#x2713;</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  border: tier.current ? '1px solid var(--color-border)' : 'none',
                  background: tier.current
                    ? 'transparent'
                    : tier.name === 'Premium'
                      ? 'var(--color-gold-bg)'
                      : tier.color,
                  color: tier.current ? 'var(--color-text-muted)' : tier.name === 'Premium' ? '#1a1a2e' : 'white',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: tier.current ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'transform var(--duration-fast)',
                }}
                onMouseEnter={(e) => { if (!tier.current) e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
        }}>
          30-day free trial &middot; Cancel anytime &middot; No credit card required to start
        </div>
      </div>
    </div>
  );
}
