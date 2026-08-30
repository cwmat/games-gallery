# 2026-08-30 — canvas-presentation

**Task**: Center the canvas (it sat off-center on wide screens) and dress the
letterbox: subtle dark gradient flow in the gutters + soft canvas edges.

**Spec §§**: GD §2.2 (amended with a Presentation paragraph).

**Files changed**: createGame.ts (CENTER_BOTH restored as the single centering
authority); styles.css (.game-canvas plain block, ::before gutter aurora —
layered indigo/slate/ember radial gradients, blur, 26s alternate drift;
canvas radial mask edge fade; reduced-motion freeze); GAME_DESIGN §2.2.

**Decisions**:
- Root cause of off-center: double-centering — CSS flex centering PLUS Phaser
  CENTER_BOTH margins. One authority only; chose Phaser (owns resize handling),
  wrapper stays a plain block. Comments in both files warn against regressing.
- Edge softening via CSS mask on the canvas (fades into the animated gutter)
  rather than an overlay div — no extra DOM, blends with whatever is behind.
- Aurora is transform/opacity animation (compositor-friendly), palette stays
  in-world (indigo/slate/ember at ≤0.14 alpha over #0b0a12).

**Deviations from spec**: none.

**Tests/gates**: pnpm gates green (29 tests). Verified centering numerically at
1900x760 (margins 274/275 symmetric) and at native pane size (full-bleed 16:9);
mask fade + aurora confirmed visually; console clean. (Pane viewport-emulation
screenshots render offset — DOM rects are the authoritative check.)

**Follow-ups**: none.
