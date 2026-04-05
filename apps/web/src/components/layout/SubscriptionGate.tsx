import type { SubscriptionTier } from '@aether/shared';
import { FEATURE_LIMITS } from '@aether/shared';

interface SubscriptionGateProps {
  feature: string;
  requiredTier: 'pro' | 'premium' | 'enterprise';
  currentTier: SubscriptionTier;
  children: React.ReactNode;
}

export function SubscriptionGate({
  feature,
  requiredTier,
  currentTier,
  children,
}: SubscriptionGateProps) {
  const tierRank: Record<string, number> = {
    free: 0,
    pro: 1,
    premium: 2,
    enterprise: 3,
  };

  if ((tierRank[currentTier] ?? 0) >= (tierRank[requiredTier] ?? 0)) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{'\u{1F512}'}</div>
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          marginBottom: 'var(--space-2)',
        }}
      >
        {feature}
      </h3>
      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        This feature requires AETHER {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          justifyContent: 'center',
        }}
      >
        <UpgradeButton tier="pro" label="Pro" price="$4.99/mo" />
        <UpgradeButton tier="premium" label="Premium" price="$9.99/mo" highlight />
      </div>
    </div>
  );
}

function UpgradeButton({
  tier,
  label,
  price,
  highlight,
}: {
  tier: string;
  label: string;
  price: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={() => {
        // TODO: Stripe Checkout integration
        console.warn(`Upgrade to ${tier} — Stripe integration pending`);
      }}
      style={{
        padding: 'var(--space-3) var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        border: highlight ? 'none' : '1px solid var(--color-border)',
        background: highlight ? 'var(--color-accent)' : 'transparent',
        color: highlight ? '#fff' : 'var(--color-text)',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.8 }}>{price}</span>
    </button>
  );
}

/**
 * Feature limit checker utility
 */
export function isFeatureAvailable(
  feature: keyof (typeof FEATURE_LIMITS)['free'],
  tier: SubscriptionTier,
  currentUsage: number,
): boolean {
  const limits = FEATURE_LIMITS[tier as keyof typeof FEATURE_LIMITS];
  if (!limits) return false;
  const limit = limits[feature];
  return currentUsage < limit;
}
