# 2026-08-30 — pixel-art-pass

**Task**: Generate the core PixelLab art set and wire it into the game, replacing
placeholder textures per the pixel-art-pipeline skill.

**Spec §§**: GD §3.3, §7 (rewritten to shipped state); TS §2, §8 (rewritten).

**Files changed**: public/assets/{player,lantern,lantern-broken,pillar,floor,wall}.png;
placeholderArt.ts (TEX: -whip, +glow/+wall; PLAYER_SHEET; only spark/glow procedural);
Player.ts (animation state machine, body sized to art feet line); CorridorScene.ts
(preload, accent glow halos, delayed whip hit, wall parallax layer); skill + docs sync.

**Decisions**:
- REST API v2 direct (MCP not connected mid-session; .env key). Async jobs polled;
  pixflux returns inline. Driver script kept in session scratchpad.
- Character: create-character-with-4-directions 32x48 side view → 76x76-cell sheet;
  east-only animations (idle 5f, walk 9f, jump 5f, whip 7f), flipX covers west.
  Character id 6a48329c-1519-4ea3-b546-903920995343 (reuse for style-matched additions).
- TEX.whip removed — the lash lives in the whip animation frames; hit delayed 300ms
  to land on the visible strike frame.
- Accent identity moved from lantern tint to a procedural additive glow halo
  (desynced pulse tween) + spark tint; broken lanterns lose the glow.
- audio noAudio stays; rAF-throttled playtests driven via window.__game.loop.step().

**Deviations from spec**: lantern is 32x48 not 24x32 (PixelLab 32px minimum edge);
docs amended in place.

**Tests/gates**: pnpm gates green (28 tests); pnpm build clean. Browser playtest:
walk/idle anims, whip → shatter → card (Hex Herbs), broken husk + glow removal,
wall parallax — verified via deterministic loop stepping; console clean on fresh load.

**Credits**: 12 generations of 2,000 Tier 1 (balance 1,988 after wall layer).
~1,988 remain — Tier 1 looks sufficient for the whole wishlist; no Tier 2 needed yet.

**Follow-ups**: lantern flicker/shatter frame anims; decorative props (torches,
banners); per-game card media; optional seamless floor tileset.
