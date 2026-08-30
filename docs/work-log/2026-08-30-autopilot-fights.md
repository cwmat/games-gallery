# 2026-08-30 — autopilot-fights

**Task**: Autoplay was walking straight past the corridor haunts — make it fight
them en route instead of only whipping lanterns.

**Spec §§**: GD §5.2 behavior list (amended), §3.4 (note added).

**Files changed**: autopilot.ts (AutopilotEnemy input + path-target selection),
autopilot.test.ts (+3 cases), CorridorScene.readAutopilotInput (feeds enemies).

**Decisions**:
- A living enemy strictly BETWEEN the player and the current lantern target
  becomes the immediate target (nearest first); enemies behind the line of
  travel are ignored (a respawn behind the player must never ping-pong the
  walk). The enemies param defaults to [] so the pure signature stays
  backward-compatible.
- Wrap-phase guard: only a swing aimed at the lantern advances carouselIndex —
  an en-route enemy kill advancing it would silently skip a lantern.
- Timing already composes: the shared 45-frame attack cooldown covers the
  300ms delayed hit, and the scene marks alive=false at the hit, so the
  autopilot re-targets the lantern on the very next frame after a kill.

**Deviations from spec**: none — GD amended with the change.

**Tests/gates**: pnpm gates green (34 tests: fights-between, ignores dead/behind,
wrap-carousel-not-advanced). Browser-verified via loop stepping: lantern 1 →
card → close → ENEMY-KILLED@x815 → LANTERN2-BROKEN@x1053, in that order.

**Follow-ups**: none.
