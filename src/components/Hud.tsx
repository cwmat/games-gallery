import type { Mode } from '../bridge/events';

interface HudProps {
  mode: Mode;
  onToggle: () => void;
  musicOn: boolean;
  sfxOn: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

export function Hud({ mode, onToggle, musicOn, sfxOn, onToggleMusic, onToggleSfx }: HudProps) {
  return (
    <div className="hud">
      <span className="hud__title">Games Gallery</span>

      <button type="button" className="hud__toggle" onClick={onToggle}>
        Autoplay: {mode === 'auto' ? 'on' : 'off'}
      </button>

      <button type="button" className="hud__toggle" onClick={onToggleMusic} aria-pressed={musicOn}>
        Music: {musicOn ? 'on' : 'off'}
      </button>

      <button type="button" className="hud__toggle" onClick={onToggleSfx} aria-pressed={sfxOn}>
        SFX: {sfxOn ? 'on' : 'off'}
      </button>

      <a className="hud__gallery-link" href="#/gallery">
        Gallery view
      </a>

      <span className="hud__hint">Arrows/AD move &middot; Up/W jumps &middot; Space/X whips</span>
    </div>
  );
}
