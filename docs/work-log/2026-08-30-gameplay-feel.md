# 2026-08-30 — gameplay-feel

**Task**: Fix the two playtest complaints from Chaz's first live session: lanterns
hung unreachably high ("can't even hit lanterns") and cards lacked a media slot.

**Spec §§**: GD §2.2, §3.3, §4, §8 (amended); TS §5 implicitly (GameMedia.poster).

**Files changed**: CorridorScene.ts (LANTERN_Y = FLOOR_TOP_Y - 60, ceiling chains,
CAMERA_ZOOM 1.5); Player.ts (grounded whip plants feet, locks facing, blocks jump);
GameCard.tsx + styles.css (16:9 hero media slot: first media entry, video autoplay
muted; "gameplay footage soon" placeholder when empty); games.ts (GameMedia.poster?,
media conventions doc); games.test.ts (poster path invariant); GAME_DESIGN sync.

**Decisions**:
- Root causes: hit test is X-only so height was purely decorative illegibility;
  AND walking during the 300ms strike delay slid the player out of alignment.
  Planted-whip fixes aim; whip-height lanterns fix legibility. No jump needed.
- Hero slot always renders (placeholder when media empty) so card layout is
  stable and the video drop-in point is visible.
- Video convention: public/assets/media/<id>.mp4 (+ optional .jpg poster),
  10-30s, ≤ ~10MB — Pages has no streaming.

**Deviations from spec**: none — docs amended in the same change.

**Tests/gates**: pnpm gates green (29 tests). Browser-verified via loop stepping:
planted whip at chain-hung lantern breaks it at eye level, card opens with hero
placeholder slot, 1.5x framing reads chunky.

**Follow-ups**: Chaz records per-game videos → add media entries; consider slight
per-lantern height variance for rhythm once footage cards are in.
