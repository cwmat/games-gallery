# 2026-08-30 — autoplay-default-labels

**Task**: Autoplay on by default for everyone (arcade attract mode), plus
floating animated title labels on each lantern.

**Spec §§**: GD §5.4 (rewritten: default is auto for all), §4 intro (labels).

**Files changed**: App.tsx (initialMode 'auto'; gate:entered emit on Enter);
bridge/events.ts (gate:entered event + isGateEntered()); CorridorScene
(autopilot idles until gate entered; lantern title labels + shatter dim).

**Decisions**:
- The attract demo HOLDS until the Enter modal is clicked — otherwise it
  breaks lanterns and pops cards underneath the title screen. First attempt
  gated by masking the mode:changed payload; that echoed back into App's own
  bus listener and clobbered the 'auto' state (HUD read "off"). Fix: the
  mode event always carries the true mode; the gate is first-class bridge
  state (gate:entered / isGateEntered) the scene checks per frame.
- Labels: Phaser text above each lantern (title, accent color, dark stroke,
  resolution 2, slow desynced bob + alpha pulse). On shatter: tween killed,
  alpha 0.4 — a dim sign over an unlit lantern; still readable for reopens.

**Deviations from spec**: none — GD amended with the change.

**Tests/gates**: pnpm gates green (34). Browser-verified: behind the modal —
HUD "Autoplay: on", scene mode auto, player moved 0px over 60 stepped frames;
after Enter — walked 268px unprompted, broke lantern 1, card opened, label
dimmed to 0.4. All five labels present with correct titles.

**Follow-ups**: none.
