# 2026-08-30 — edge-fade-fix

**Task**: Canvas edges still read as hard rectangles on the live site — Chaz asked
for a stronger fade.

**Spec §§**: GD §2.2 Presentation paragraph (amended).

**Files changed**: styles.css (canvas mask), GAME_DESIGN §2.2.

**Decisions**:
- Root cause found, not a tuning issue: `radial-gradient(ellipse 100% 100% ...)`
  percentage radii resolve against the FULL box dimensions (not half), so the
  74%→99% fade ring sat entirely outside the canvas — the corners peak at shell
  ~0.71, the whole canvas was inside the opaque hold, and the mask was a no-op.
- Replaced with two linear gradients (horizontal + vertical) composited via
  `mask-composite: intersect` (+ `-webkit-mask-composite: destination-in`) —
  an even fade on all four edges, unlike an ellipse which over-fades corners.
- Fade width is the `--canvas-fade` custom property (8% per edge) for one-line
  tuning.

**Deviations from spec**: none.

**Tests/gates**: pnpm gates green (29 tests). Verified in-browser: computed
`maskComposite: "intersect, intersect"` on the canvas, and the floor/walls
visibly melt into the gutter aurora on all four edges.

**Follow-ups**: none — tune `--canvas-fade` if 8% is too little/much.
