---
name: pixel-art-pipeline
description: Generate PixelLab pixel art and wire it into Phaser, replacing placeholder textures key-for-key.
---

# Pixel Art Pipeline

## Preconditions

- `PIXELLAB_SECRET` must be set in the repo `.env` (REST path) or in the
  shell env BEFORE launching Claude Code (MCP path — `.env` is NOT
  auto-loaded by `.mcp.json`, and MCP servers only connect at session
  start).
- Two equally good routes:
  - **MCP**: `/mcp` shows `pixellab` connected; use its tools directly.
  - **REST v2** (proven 2026-08-30): `https://api.pixellab.ai/v2`, Bearer
    auth from `.env`. Async endpoints return `background_job_id` — poll
    `GET /background-jobs/{id}`. `create-image-pixflux` returns the image
    inline/synchronously — save it from the response. Spec:
    `https://api.pixellab.ai/v2/llms.txt`.
- Check credits first (`get_balance` tool or `GET /balance` — free).
  Observed costs: map object / pixflux image ≈ 1 generation; 4-direction
  character ≈ 2; one east-only character animation ≈ 1-3.

## Asset state (2026-08-30 art pass)

Sizes and `TEX` keys are contractual — `src/game/placeholderArt.ts` is the
source of truth, not this list. **Shipped** (in `public/assets/`, loaded in
`CorridorScene.preload`):

- `player.png` — character sheet, 76x76 cells, 9 columns (frame layout in
  `PLAYER_SHEET`): row 0 rotations (south/west/east/north; east = frame 2),
  row 1 idle 5f (9-13), row 2 whip 7f (18-24), row 3 jump 5f (27-31),
  row 4 walk 9f (36-44). East-only animations; `flipX` covers west.
  PixelLab character id `6a48329c-1519-4ea3-b546-903920995343` — reuse it
  (`POST /animate-character`, `directions: ["east"]`, even `frame_count`
  4-16) to add animations in the same style.
- `lantern.png` 32x48 (map object, `view: "side"`), `lantern-broken.png`
  32x48 (same, `init_image` of the lit one at strength ~120 to keep the
  silhouette). **Filename note:** `TEX.lanternBroken`'s *value* is
  `'lantern-broken'` — files are named by the value string.
- `pillar.png` 48x256, `floor.png` 64x64, `wall.png` 320x256 background
  parallax strip (pixflux).

**Procedural — do not generate:** `TEX.spark` (4x4 particle) and
`TEX.glow` (radial halo carrying each game's accent color; the lantern art
itself is never tinted).

Notes: map objects have a 32px minimum edge; animation frames-per-request
shrinks as sprite size grows (16 frames at ~32-48px, 4 at 128px);
`animate-character` frame counts must be even (4-16), and the result gets
+1 start frame.

## Style guide

Gothic castle: deep blue/purple stone (`#0b0a12` base), warm amber lantern
light (`#f6b26b`), 1px black outlines, limited palette per sprite, readable
silhouettes at 2x scale. Prompts that worked: "dark fantasy castlevania
prop/style", "deep blue-grey gothic", "warm amber candle flame".

## Workflow

1. Generate (MCP tools or REST driver).
2. Save the PNG to `public/assets/<TEX value>.png`.
3. Load it in `CorridorScene.preload` (`load.image` or `load.spritesheet`
   with the real frame size).
4. Delete that key's generator branch in `placeholderArt.ts` (only
   `spark` + `glow` generators remain).
5. TEX keys are the contract — NEVER rename them to ship art.
6. Run `pnpm gates` + a browser playtest. If the app window is
   backgrounded, rAF throttling freezes Phaser — drive frames
   deterministically via the dev hook: step `window.__game.loop.step(t)`
   with advancing timestamps.
7. Record credits spent and files touched in the work-log entry
   (`record-of-work` skill).

## Remaining wishlist (not yet generated)

- Lantern idle flicker + shatter frame animations (object animations on
  the lantern; scene currently swaps static textures).
- Decorative props: torches, candelabra, banners, chains, rubble.
- Per-game media screenshots for cards (`GameEntry.media`) — not PixelLab.
- Optional: bespoke seamless floor via `create-tileset-sidescroller`
  (tile_size 16/32) if the pixflux tile's seams ever bother anyone.
