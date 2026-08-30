# 2026-08-30 — audio-generation

**Task**: Mint the theme + four SFX with ElevenLabs into the slots the
AudioController ships, and verify the whole chain plays.

**Spec §§**: GD §10 (no doc changes — behavior as specced).

**Files changed**: NEW public/assets/audio/{theme,whip,shatter,reopen,enemy-die}.mp3;
audio.ts (+dev-only window.__audio hook); audio-pipeline SKILL.md (proven API
shapes + headless verification recipe).

**Decisions**:
- SFX via POST /v1/sound-generation (duration_seconds min is 0.5 — a 0.4s
  request 400s; error JSON lands in curl's -o file). Theme via POST /v1/music
  (75s ≈ 1.2MB mp3); loop direction goes in the prompt itself.
- Restricted API keys without user_read can't check credits but generate fine.
- Original prompt directions only: whip = dry leather crack + air whoosh;
  shatter = glass + low boom + chime tail; reopen = light metallic tink;
  enemy-die = bone clatter + ghostly sigh; theme = dark heroic gothic action
  loop, chiptune-flavored guitars + organ stabs, seamless loop.

**Deviations from spec**: none.

**Tests/gates**: pnpm gates green. Browser-verified via __audio hook: all five
files HEAD 200; after Enter + music toggle on — theme playing (75s, loop=true,
vol 0.35, clock advancing); real bus emit fx:whip advanced the clip to 0.34s.
Console clean. (I can't hear — Chaz owns the taste pass; regen per slot is
one curl.)

**Follow-ups**: taste pass by Chaz; regenerate any slot that misses the mood;
theme loop-seam listen check.
