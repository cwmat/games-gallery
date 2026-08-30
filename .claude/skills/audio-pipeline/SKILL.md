---
name: audio-pipeline
description: Generate the loop music and SFX with ElevenLabs and drop them into the slots the AudioController already loads.
---

# Audio Pipeline

## Preconditions

- `ELEVENLABS_API_KEY` set in the repo `.env` (dev-time only; never reaches
  the bundle).
- The playback plumbing already ships: `src/audio/audio.ts` HEAD-checks each
  file below and stays silent-but-clean when one is missing, the Enter modal
  provides the browser-required user gesture, and the HUD has Music/SFX
  toggles (persisted per-visitor via localStorage). Generating a file and
  putting it at the right path is the ENTIRE integration.

## File slots (public/assets/audio/)

| File | Trigger (`fx` bridge event) | Direction |
|---|---|---|
| `theme.mp3` | looped site music after Enter | ~60-90s seamless loop; dark, driving, heroic — gothic action energy in a retro/chiptune-flavored metal style; must loop without an audible seam |
| `whip.mp3` | every whip swing | short sharp crack + air swish, ~0.4s |
| `shatter.mp3` | lantern breaks first time | glass shatter + low boom + faint magical chime tail, ~0.8s |
| `reopen.mp3` | re-whipping a broken lantern | small metallic tink + soft whoosh, ~0.4s |
| `enemy-die.mp3` | enemy killed | punchy impact; bones clattering / a ghostly dissipating sigh both read well, ~0.7s |

Keep SFX ≤ ~100KB and the theme ≤ ~3MB (Pages serves statically). Volumes
are normalized in code (music 0.35, sfx 0.5) — aim for consistent loudness
across clips rather than tweaking code constants.

## ElevenLabs REST (shapes proven 2026-08-30)

- Auth header on every call: `xi-api-key: $ELEVENLABS_API_KEY`. A restricted
  key without `user_read` cannot call `GET /v1/user/subscription` (credit
  check) but generates fine — don't treat that 401 as a broken key.
- SFX: `POST https://api.elevenlabs.io/v1/sound-generation` with JSON
  `{ "text": "<description>", "duration_seconds": <n>, "prompt_influence": 0.45 }`
  → returns mp3 bytes (128kbps 44.1kHz). `duration_seconds` must be
  **0.5-30** — 0.4 is rejected with a 400.
- Music: `POST https://api.elevenlabs.io/v1/music` with
  `{ "prompt": "<mood/style/loop direction>", "music_length_ms": <n> }`
  → returns mp3 bytes directly (75s ≈ 1.2MB). Put "seamless loop, no
  intro fade-in, no outro fade-out, loops perfectly back to the start" in
  the prompt itself.
- A 400 error body lands wherever curl's `-o` points — check small output
  files for JSON before trusting them as audio.

## Workflow

1. Generate a candidate clip → save to `public/assets/audio/<slot>.mp3`.
2. `pnpm dev`, click Enter, verify in-browser: theme loops cleanly, SFX fire
   on whip/shatter/reopen/enemy-die, both HUD toggles work. Headless check:
   the dev-only `window.__audio` hook exposes the controller — music
   playing = `!__audio.music.paused`, a fired clip has `currentTime > 0`
   (emit a real `bus.emit('fx', {kind})` via a dynamic import of
   `src/bridge/events.ts` to exercise the true path).
3. Iterate on the prompt until the mood fits (§7 of GAME_DESIGN: dark gothic,
   amber warmth, self-aware fun — intense but not grim).
4. Loop check for the theme: play the file twice back-to-back; an audible
   seam means regenerate or trim tail silence.
5. Record credits spent + prompts used in the work-log (record-of-work skill).

## Adding a new SFX slot

Add the `FxKind` union member in `src/bridge/events.ts`, map its file in
`SFX_FILES` (src/audio/audio.ts), emit `bus.emit('fx', { kind })` at the
game moment, generate the clip. Nothing else.
