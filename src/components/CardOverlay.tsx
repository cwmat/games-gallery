import { useEffect, useRef } from 'react';
import { CARD_AUTO_CLOSE_MS } from '../game/config';
import type { GameEntry } from '../data/games';
import { GameCard } from './GameCard';

const FOCUSABLE_SELECTOR = 'a[href], button, video, [tabindex]:not([tabindex="-1"])';

interface CardOverlayProps {
  game: GameEntry;
  autoAdvance: boolean;
  onEngage: () => void;
  onClose: () => void;
}

export function CardOverlay({ game, autoAdvance, onEngage, onClose }: CardOverlayProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    closeButtonRef.current?.focus();

    return () => {
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
          if (active === first || !panel.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !panel.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);

  return (
    <div className="card-overlay">
      <div className="card-overlay__backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="card-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${game.title} details`}
        // Hover-capable pointers only: on touch, the first tap must not
        // silently cancel the autoplay dwell (tap-to-advance stays intact).
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') onEngage();
        }}
        // The programmatic auto-focus of the Close button on mount is not the
        // reader engaging with the card; user-driven focus (tabbing in) is.
        onFocusCapture={(event) => {
          const target: EventTarget | null = event.target;
          if (target === closeButtonRef.current && event.relatedTarget === null) return;
          onEngage();
        }}
      >
        <button ref={closeButtonRef} type="button" className="card-overlay__close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {autoAdvance && (
          <div className="card-overlay__progress" style={{ animationDuration: `${CARD_AUTO_CLOSE_MS}ms` }} />
        )}
        <GameCard game={game} />
      </div>
    </div>
  );
}
