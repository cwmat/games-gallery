// Audio controller for music + SFX. Plain module — no React, no Phaser
// (the Phaser game runs with noAudio; sound lives entirely out here, wired
// through bridge `fx` events so it works in manual play AND autoplay).
//
// Files are optional: each is HEAD-checked before use, so the site is
// silent-but-clean until the audio-pipeline skill generates them.
import { bus } from '../bridge/events';
import type { FxKind } from '../bridge/events';

const MUSIC_VOLUME = 0.35;
const SFX_VOLUME = 0.5;

const MUSIC_FILE = 'assets/audio/theme.mp3';
const SFX_FILES: Record<FxKind, string> = {
  whip: 'assets/audio/whip.mp3',
  shatter: 'assets/audio/shatter.mp3',
  reopen: 'assets/audio/reopen.mp3',
  'enemy-die': 'assets/audio/enemy-die.mp3',
};

function url(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

function readPref(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === 'true';
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private mode etc. — preference just won't persist */
  }
}

class AudioController {
  private unlocked = false;
  private musicEnabled = readPref('gg-music', true);
  private sfxEnabled = readPref('gg-sfx', true);
  private music: HTMLAudioElement | null = null;
  private sfx = new Map<FxKind, HTMLAudioElement>();
  private initStarted = false;

  /** Probe which audio files exist and subscribe to game fx. Idempotent. */
  init(): void {
    if (this.initStarted) return;
    this.initStarted = true;

    void this.probe(MUSIC_FILE).then((ok) => {
      if (!ok) return;
      const el = new Audio(url(MUSIC_FILE));
      el.loop = true;
      el.volume = MUSIC_VOLUME;
      el.preload = 'auto';
      this.music = el;
      this.syncMusic();
    });

    for (const [kind, path] of Object.entries(SFX_FILES) as [FxKind, string][]) {
      void this.probe(path).then((ok) => {
        if (!ok) return;
        const el = new Audio(url(path));
        el.volume = SFX_VOLUME;
        el.preload = 'auto';
        this.sfx.set(kind, el);
      });
    }

    bus.on('fx', ({ kind }) => this.playSfx(kind));
  }

  /** Call from a real user gesture (the Enter modal) — allows playback. */
  unlock(): void {
    this.unlocked = true;
    this.syncMusic();
  }

  get isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  get isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    writePref('gg-music', enabled);
    this.syncMusic();
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    writePref('gg-sfx', enabled);
  }

  private async probe(path: string): Promise<boolean> {
    try {
      const res = await fetch(url(path), { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  private syncMusic(): void {
    if (!this.music) return;
    if (this.unlocked && this.musicEnabled) {
      void this.music.play().catch(() => {
        /* browser refused (no gesture yet) — the next unlock retries */
      });
    } else {
      this.music.pause();
    }
  }

  private playSfx(kind: FxKind): void {
    if (!this.unlocked || !this.sfxEnabled) return;
    const clip = this.sfx.get(kind);
    if (!clip) return;
    clip.currentTime = 0;
    void clip.play().catch(() => {
      /* ignore — e.g. rapid retrigger race */
    });
  }
}

export const audio = new AudioController();

if (import.meta.env.DEV) {
  // Playtest hook, mirroring window.__game: lets browser-driven test
  // sessions confirm what is actually loaded and playing.
  (window as unknown as { __audio?: AudioController }).__audio = audio;
}
