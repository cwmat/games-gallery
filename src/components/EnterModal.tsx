import { useEffect, useRef } from 'react';

interface EnterModalProps {
  onEnter: () => void;
}

/**
 * Title-card gate shown on landing. Its real job: the click is the user
 * gesture browsers require before audio may play (see src/audio/audio.ts).
 * The corridor is visible behind the translucent backdrop, attract-style.
 */
export function EnterModal({ onEnter }: EnterModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div className="enter-modal" role="dialog" aria-modal="true" aria-label="Enter the gallery">
      <div className="enter-modal__panel">
        <h1 className="enter-modal__title">Games Gallery</h1>
        <p className="enter-modal__tagline">A corridor of hobby games. Whip a lantern, meet a project.</p>
        <button ref={buttonRef} type="button" className="enter-modal__button" onClick={onEnter}>
          Enter the castle
        </button>
        <p className="enter-modal__hint">music &amp; sfx toggles live in the top bar</p>
      </div>
    </div>
  );
}
