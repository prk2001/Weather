import { SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function ShortcutsOverlay({ visible, onClose }: ShortcutsOverlayProps) {
  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          maxWidth: '360px',
          width: '90%',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
            color: 'var(--color-text)',
          }}
        >
          Keyboard Shortcuts
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {Object.entries(SHORTCUTS).map(([key, { label }]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {label}
              </span>
              <kbd
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                }}
              >
                {key === 'Escape' ? 'Esc' : key}
              </kbd>
            </div>
          ))}

          {/* Extra shortcut not in SHORTCUTS map */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Quick search
            </span>
            <kbd
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                padding: '2px 8px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
              }}
            >
              {'\u2318'}K
            </kbd>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-4)',
            textAlign: 'center',
          }}
        >
          Press ? to toggle this overlay
        </p>
      </div>
    </div>
  );
}
