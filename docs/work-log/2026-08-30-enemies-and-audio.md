# 2026-08-30 — enemies-and-audio

**Task**: Corridor enemies with idle/death animations + punchy impact effects
(lanterns too), and the full audio stack: ElevenLabs key slot, enter-gate modal,
music/SFX toggles, fx event plumbing.

**Spec §§**: GD §3.4 (new), §10 (new); TS §2, §3.3 skill 5, §4.1.

**Files changed**: NEW effects.ts, objects/Enemy.ts, audio/audio.ts,
components/EnterModal.tsx, .claude/skills/audio-pipeline; edited placeholderArt
(ENEMY_KINDS), config (enemyXs + tests), CorridorScene (enemy spawn/kill, shatter
punch-up, delayed pause beat, fx emits), bridge (fx event), Hud (music/sfx
toggles), App (enter gate, audio wiring), styles, .env.example (ELEVENLABS_API_KEY).

**Decisions**:
- Enemies: PixelLab skeleton warrior + hovering wraith at gap midpoints
  (enemyXs, alternating), stationary, no damage/collision — whip-arc kills every
  enemy in band; never pauses the scene. Respawn 16-22s fade-in. ~9 gens
  (1 lost to a server-side crash, resubmit worked). Balance: 1,983/2,000 left.
- Impact kit (effects.ts): white hitFlash + accent glow ring (ADD blend tween) +
  spark burst + camera shake (skipped under prefers-reduced-motion). Lantern
  shatter uses it; scene pause now waits 350ms so the burst plays out.
- Audio: Phaser stays noAudio; HTMLAudio controller keyed off new bridge 'fx'
  events (whip/shatter/reopen/enemy-die) → identical in manual + autoplay.
  Files optional via HEAD-check (silent until generated). Enter modal = the
  unlock gesture, shows every visit, doubles as title card. Toggles persist
  (gg-music/gg-sfx). Wraith death row re-solidifies at tail → range trimmed.

**Deviations from spec**: none — GD §3.4/§10 authored with the change.

**Tests/gates**: pnpm gates green (31 tests: +enemyXs). Browser-verified via
loop stepping: modal → enter → whip kills skeleton (death anim, burst), fade-out,
respawn after fast-forward, wraith idles, toggles flip + persist, console clean.

**Follow-ups**: generate audio once ELEVENLABS_API_KEY lands (audio-pipeline
skill has slots + mood direction); consider whip-hit SFX variation later.
