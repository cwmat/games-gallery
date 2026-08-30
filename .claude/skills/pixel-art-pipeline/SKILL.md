---
name: pixel-art-pipeline
description: Generate PixelLab pixel art and wire it into Phaser, replacing placeholder textures key-for-key.
---

# Pixel Art Pipeline

## Preconditions

- `PIXELLAB_SECRET` must be set in the shell env BEFORE launching Claude
  Code — `.env` is NOT auto-loaded.
- `/mcp` must show `pixellab` connected.
- Check remaining credits with the `get_balance` MCP tool before spending
  any (retrieval calls are free).

## Asset specs

Sizes and `TEX` keys are contractual — verify every one against `TEX` in
`src/game/placeholderArt.ts` before generating anything; that module is
the source of truth, not this list.

- Sprites run 24-48px (long edge). At that size you get 16 animation
  frames per request; frames-per-request shrinks as size grows, capping
  at 4 frames for 128x128.
- `TEX.player` (`'player'`) — 32x48 (not 48x48): idle (4f), walk (8f),
  jump (2f), whip (5f).
- `TEX.whip` (`'whip'`) — 90x6: a single static frame, no animation — the
  swing reads through the sprite flashing visible/hidden, not frame
  playback.
- `TEX.lantern` (`'lantern'`) — 24x32: idle flicker (4f), shatter (6f).
- `TEX.lanternBroken` (`'lantern-broken'`) — 24x32: static husk, no
  animation. **File name note:** the `TEX` object key is `lanternBroken`,
  but its *value* — and therefore the PNG filename — is `lantern-broken`.
  Save this one as `public/assets/lantern-broken.png`, matching the value
  string, not the camelCase key.
- `floor` tile (`TEX.floor`) — 64x64.
- `pillar` (`TEX.pillar`) — 48x256.
- `spark` (`TEX.spark`, 4x4) stays procedural — do not generate; keep the
  placeholder generator.
- Phaser expects horizontal-strip spritesheets with uniform frame size.

## Style guide

Gothic castle: deep blue/purple stone (`#0b0a12` base), warm amber lantern
light (`#f6b26b`), 1px black outlines, limited palette per sprite, readable
silhouettes at 2x scale.

## Workflow

1. Generate via the `pixellab` MCP tools.
2. Save the PNG to `public/assets/<TEX value>.png` — the `TEX` *value*
   string from `src/game/placeholderArt.ts`, not the object key (they
   differ for `TEX.lanternBroken`, whose value is `'lantern-broken'` —
   see Asset specs above).
3. Add `scene.load.spritesheet(TEX.<key>, 'assets/<key>.png', { frameWidth,
   frameHeight })` in `CorridorScene` preload.
4. Delete that key's generator branch in `placeholderArt.ts`.
5. TEX keys are the contract — NEVER rename them to ship art.
6. Run `pnpm gates` + a browser playtest.
7. Record credits spent and files touched in the work-log entry
   (`record-of-work` skill).
