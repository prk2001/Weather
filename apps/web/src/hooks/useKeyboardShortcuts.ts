import { useEffect, useState, useCallback } from 'react';

export type Panel = 'glance' | 'hourly' | 'daily' | 'details' | 'radar' | 'search';

interface KeyboardShortcutsResult {
  activePanel: Panel;
  setActivePanel: (panel: Panel) => void;
  showShortcuts: boolean;
  toggleShortcuts: () => void;
}

const SHORTCUTS: Record<string, { panel?: Panel; action?: string; label: string }> = {
  '?': { action: 'toggle_help', label: 'Show shortcuts' },
  Escape: { panel: 'glance', label: 'Glance mode' },
  h: { panel: 'hourly', label: 'Hourly timeline' },
  d: { panel: 'daily', label: 'Daily forecast' },
  c: { panel: 'details', label: 'Conditions' },
  r: { panel: 'radar', label: 'Radar' },
  '/': { panel: 'search', label: 'Search location' },
};

export function useKeyboardShortcuts(): KeyboardShortcutsResult {
  const [activePanel, setActivePanel] = useState<Panel>('glance');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't capture with modifier keys (except shift for ?)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        // Cmd/Ctrl+K for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setActivePanel('search');
          return;
        }
        return;
      }

      const shortcut = SHORTCUTS[e.key];
      if (!shortcut) return;

      e.preventDefault();

      if (shortcut.action === 'toggle_help') {
        toggleShortcuts();
        return;
      }

      if (shortcut.panel) {
        setActivePanel(shortcut.panel);
        setShowShortcuts(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleShortcuts]);

  return { activePanel, setActivePanel, showShortcuts, toggleShortcuts };
}

export { SHORTCUTS };
