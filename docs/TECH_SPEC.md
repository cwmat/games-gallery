# Games Gallery — Tech Spec

Companion to `GAME_DESIGN.md`. Covers the stack, the repo layout, the
agentic workflow, the React/Phaser seam, the data model, build/deploy, and
the art pipeline.

---

## 1. Stack

- **Vite 7** — build tool and dev server, single-page app, no backend.
- **React 19** for the shell, the resume-card overlay, and the gallery
  view.
- **TypeScript ~5.9**, strict, across the whole repo.
- **Phaser 3.90.x** for the corridor scene only, mounted inside a React
  component and lifecycle-managed by React (§4).
- **Vitest 4** for unit tests; **ESLint 9** flat config for linting.
- **pnpm 10**, **Node 24**.
- Deployed as a static site to **GitHub Pages** at
  `https://cwmat.github.io/games-gallery/`.

No server, no database, no auth. `src/data/games.ts` is the entire content
layer (§5).

---

## 2. Repo layout

```
games-gallery/
  CLAUDE.md                 # agent operating rules (authored at scaffold, see §3.2)
  .claude/
    skills/                 # agentic workflow skills (see §3.3)
  .githooks/                 # pre-push hook running `pnpm gates` (see §3.3 skill 3, §6)
  .mcp.json                  # PixelLab MCP server config (see §9)
  .env.example                # PIXELLAB_SECRET placeholder for local shells
  docs/
    GAME_DESIGN.md            # game/UX design — source of truth
    TECH_SPEC.md              # this doc
    work-log/
      INDEX.md                 # one line per completed task — agents read this, not every entry
  src/
    main.tsx                   # app entry, mounts <App/>
    App.tsx                    # route switch on useHashRoute()
    styles.css                 # the entire stylesheet — vanilla CSS, no CSS-in-JS
    data/
      games.ts                 # GameEntry[] — the single content source (§5)
      games.test.ts             # invariant tests for games.ts (§7)
    bridge/
      events.ts                # typed Phaser<->React emitter (§4) — no Phaser or React import
      events.test.ts            # Bridge emitter tests (§7)
    game/
      config.ts                # layout constants + corridorLayout() (§2 of design doc) — no Phaser import
      layout.test.ts            # corridorLayout() tests (§7)
      autopilot.ts               # pure InputState driver for attract mode (§4.2; design doc §5)
      autopilot.test.ts          # AutopilotController tests (§7)
      placeholderArt.ts          # TEX key contract + PLAYER_SHEET layout + procedural spark/glow
      createGame.ts               # constructs the Phaser.Game instance (§4.2)
      objects/
        Player.ts                 # player sprite: movement, facing, animation state machine
      scenes/
        CorridorScene.ts          # the corridor Phaser.Scene: lanterns, input, bridge wiring (§4)
    hooks/
      useHashRoute.ts           # '#/gallery' -> 'gallery', else -> 'game'
    components/
      GameCanvas.tsx             # owns the Phaser.Game lifecycle (§4.2), React.lazy-loaded from App.tsx
      CardOverlay.tsx            # dialog chrome around a card: focus trap, autoplay progress bar
      GameCard.tsx                # renders one GameEntry — shared by CardOverlay and GalleryView
      GalleryView.tsx             # #/gallery grid (React.lazy split from the game bundle)
      Hud.tsx                     # title, autoplay toggle, gallery link, controls hint
  .github/
    workflows/
      deploy.yml                 # build + deploy to Pages on push to main (§6)
  package.json
  vite.config.ts                 # base: '/games-gallery/'
  tsconfig.json
  eslint.config.js
```

`public/assets/` holds the PixelLab art (player spritesheet, lanterns,
pillar, floor, wall — see §8 for the key/size table); only the spark and
glow textures remain procedural in `placeholderArt.ts`.

Two files carry the load-bearing contracts other code is written against:
`src/bridge/events.ts` (the only channel between React and Phaser) and
`src/game/config.ts` (shared layout constants and math). Both are plain
TypeScript with zero engine or framework imports, which is what makes them
safe to import from either side (§4).

---

## 3. Agentic Development Workflow

This project is built spec-first with Claude. **`GAME_DESIGN.md` +
`TECH_SPEC.md` are the complete context package**: a planning session
pointed at both, plus the work log, should be able to scaffold and execute
without further briefing. Both live in-repo under `docs/` as the source of
truth; when the design or the architecture changes, the doc changes first,
then code follows.

### 3.1 What the scaffold provides

The initial scaffold task creates, alongside app code:

1. `CLAUDE.md` at repo root (contents in §3.2).
2. `.claude/skills/` containing the four skills in §3.3.
3. `docs/` with both spec docs plus `docs/work-log/INDEX.md` (empty,
   header only).
4. `.githooks/` with a pre-push hook wired via the `prepare` npm script
   (`git config core.hooksPath .githooks`), enforcing `pnpm gates` before
   any push leaves the machine.
5. The contract files (`src/data/games.ts`, `src/bridge/events.ts`,
   `src/game/config.ts`, `src/game/placeholderArt.ts`,
   `src/hooks/useHashRoute.ts`) stubbed to their exact contracted shapes,
   so every later agent is writing against the same types from commit one.

### 3.2 What CLAUDE.md contains

`CLAUDE.md` records the standing operating rules every session and
subagent inherits. Minimum contents:

- **Source of truth rule:** `docs/GAME_DESIGN.md` and `docs/TECH_SPEC.md`
  govern; spec changes precede code changes.
- **Bridge-purity rule:** `src/bridge/events.ts` and `src/game/config.ts`
  never import Phaser or React (§4). This is the rule that keeps the
  `React.lazy` split around Phaser real instead of accidental.
- **Data-driven content rule:** every game is one entry in
  `src/data/games.ts` (design doc §8). No game-specific components, no
  hard-coded lantern positions.
- **Record-of-work rule:** every completed task appends a
  `docs/work-log/` entry before it is considered done (format in §3.3).
- **Model tiering preference:** when fanning out subagents, right-size the
  model tier to the task. Cheap/fast tiers handle mechanical work (content
  entries, boilerplate, test scaffolds, doc formatting); mid tiers handle
  feature implementation; top tiers are reserved for the
  React/Phaser seam, autopilot logic, and review. **Every fanned-out work
  product receives adversarial review by a model at least one tier above
  its producer before merge.**
- **Validation gates:** `pnpm gates` (lint + typecheck + test) must pass
  before any push; `pnpm gates:full` (adds `build`) must pass before any
  deploy-affecting merge.

### 3.3 Claude skills (in `.claude/skills/`)

**Skill 1 — `tiered-fanout`.** Governs all subagent dispatch. Before
fanning out, it classifies each work item (mechanical / implementation /
judgment) and assigns the lowest model tier that can plausibly succeed,
recording the assignment in the work log. It then enforces the
adversarial-review rule from `CLAUDE.md`: producer output is reviewed by a
higher-tier model with an explicitly critical prompt (spec violations,
bridge-purity breaks, contract drift on `games.ts`/`config.ts`/`events.ts`,
accessibility gaps in the gallery), not a rubber-stamp summary. Includes an
escalation rule: if a lower-tier agent stalls or fails review twice, the
task re-tiers upward rather than burning tokens on retries.

**Skill 2 — `record-of-work`.** Enforces the work-log construct. On task
completion it appends a dated entry under `docs/work-log/` — task summary,
spec sections touched, files changed, decisions made and their rationale,
deviations from spec (flagged loudly), test/gate results, and follow-ups —
and appends the corresponding one-line summary to
`docs/work-log/INDEX.md` in the `YYYY-MM-DD — <slug> — <spec sections> —
<outcome>` format, newest entry first. Session-start context comes from
reading `INDEX.md`, not replaying every entry, so project memory survives
across sessions and subagents instead of living in one chat's context.

**Skill 3 — `git-workflow`.** Owns branch, commit, and push discipline for
a small single-maintainer repo deployed straight off `main`: short-lived
feature branches per task, `pnpm gates` run (and enforced by the
`.githooks` pre-push hook it maintains) before any push, conventional
commit-style messages that name the spec section a change implements, and
merging via `gh pr merge --merge` — a real merge commit, never squash or
rebase — so branch history is preserved and `git log` on `main` still
reads as a changelog of merged features. It is also the skill responsible
for keeping `.githooks/pre-push` in sync with whatever `gates` currently
means, so the local hook and CI (`deploy.yml`, §6) never drift apart.

**Skill 4 — `pixel-art-pipeline`.** The art-pass workhorse. Generates real
sprites via the PixelLab MCP server (config in `.mcp.json`, assumptions in
§9) keyed one-for-one against the `TEX` contract in
`src/game/placeholderArt.ts` — same key, same canvas dimensions, same
dark-gothic/amber/purple palette lock — so swapping placeholder Graphics
shapes for curated pixel art never touches a call site outside that one
module. Batches by `TEX` key, drops candidates for human curation, and
never edits scene logic, only the texture-producing module.

### 3.4 Planning-session handoff

To start a build session: point a Claude planning session at
`docs/GAME_DESIGN.md` and `docs/TECH_SPEC.md`, ask it to execute the §3.1
scaffold, then proceed through implementation via `tiered-fanout`. No
other briefing should be required; if a session needs context not found in
these docs or the work log, that is **a doc gap to fix, not a chat message
to send.**

---

## 4. React/Phaser integration

### 4.1 The bridge is the only channel

`src/bridge/events.ts` (contract: `Bridge` emitter class + `bus` singleton
+ `BridgeEvents` map for `'lantern:broken'`, `'card:closed'`,
`'mode:changed'`) is the **only** communication path between the Phaser
scene and React. Neither side reaches into the other's internals — no
`sceneRef.current.someMethod()` calls from React into scene state, no
Phaser code importing a React component or context. If a new interaction
needs to cross the boundary, it gets a new event on `BridgeEvents`, not a
side channel.

### 4.2 Game lifecycle

Exactly one `Phaser.Game` instance exists at a time, created and destroyed
inside a single `useEffect` in `src/components/GameCanvas.tsx`, which owns
the container `div` and delegates construction to `createGame()`
(`src/game/createGame.ts`):

- `createGame(container)` builds the `Phaser.Game` (fixed
  `GAME_WIDTH x GAME_HEIGHT`, `Phaser.Scale.FIT`, arcade physics,
  `pixelArt: true`) and registers `CorridorScene` as its only scene. In
  dev (`import.meta.env.DEV`) it also stashes the instance on
  `window.__game` as a playtest hook for browser-driven test sessions.
- `GameCanvas` calls `createGame()` on mount. On unmount (or before
  re-construction, guarding React 19 Strict Mode's mount→unmount→mount
  dev cycle) it calls `game.destroy(true)` — `true` to also remove the
  canvas from the DOM. No `Phaser.Game` is ever constructed without a
  matching `destroy(true)` on cleanup.

**Mode handshake.** `GameCanvas` is behind a `React.lazy` boundary
(`App.tsx`), so `CorridorScene` can mount *after* React has already
emitted its initial `mode:changed` — a scene that only listened for the
event would miss that first emit and start in the wrong mode. The bridge
(`src/bridge/events.ts`) closes this race by recording the latest
`mode:changed` payload in module state (`currentMode`) and exposing
`getCurrentMode()`; `CorridorScene.create()` calls `getCurrentMode()`
directly instead of waiting on the next event, so it always starts synced
regardless of mount order.

**Manual takeover.** `CorridorScene` attaches a `window`-level `keydown`
listener (not Phaser's own input system) filtered to a `GAME_CONTROL_KEYS`
set — arrows, `A`/`D`/`W`, `X`, `Space` — so that only real game-control
keys flip `mode` from `'auto'` to `'manual'`; everything else (`Tab`,
`Escape`, modifiers, browser shortcuts) is ignored. It has to be
window-level because takeover must still work while the scene is paused
behind a card (§4.3), which Phaser's per-scene input would not see.

### 4.3 Pause/resume around the card

The scene, not React, decides when to pause: after emitting
`lantern:broken { gameId }` it calls `this.input.keyboard?.disableGlobalCapture()`
(so the paused scene's keyboard plugin stops swallowing events the card
overlay needs) and then `scene.pause()`. React owns nothing about *when*
to pause — it only reacts to the event by rendering the card, and it is
responsible for emitting `card:closed` when the card goes away (explicit
close, `Escape`, or the `CARD_AUTO_CLOSE_MS` dwell timer in autoplay). The
scene's only job on `card:closed` is to call `scene.resume()` and
`this.input.keyboard?.enableGlobalCapture()`, mirroring the disable call
above. This keeps "is the game paused" as scene-owned state instead of
something React and Phaser could each believe independently.

### 4.4 Cleanup discipline

Any scene code that calls `bus.on(...)` **must** call the matching
`bus.off(...)` in the scene's `shutdown` or `destroy` handler. This is not
optional cleanliness — without it, React Strict Mode's double-invoke
behavior (and any future scene restart) leaves stale listeners firing
against a torn-down scene, which is the single most likely source of
"why did the card open twice" bugs in this architecture.

### 4.5 Chunk discipline

`src/bridge/events.ts` and `src/game/config.ts` must never import Phaser
(and the bridge must never import React either). This is what makes the
`React.lazy` boundary around the Phaser-owning component effective: the
gallery route (`#/gallery`) can import `games.ts` and the bridge's types
without pulling Phaser into its chunk, so visiting `/gallery` directly
never downloads the game engine.

---

## 5. Data model

`src/data/games.ts` (`GameEntry[]`, contract in the design doc §8) is the
single content source for the entire site. Nothing else defines game data:

- **The corridor** derives lantern count and position from
  `games.length` via `corridorLayout()` (§2 of the design doc), and each
  lantern's `gameId` is a `GameEntry.id`.
- **The resume card** renders directly from one `GameEntry`, whichever
  side opened it (a broken lantern, or a gallery-grid click).
- **The gallery** maps `games` straight into grid cards with no
  intermediate transform.

Adding, editing, or reordering a game is a `games.ts` edit; no other file
should need to change for a content-only update (§8.2 of the design doc).

---

## 6. Build and deploy

- **Vite `base: '/games-gallery/'`** — required for every asset URL to
  resolve correctly under GitHub Pages' project-site path
  (`https://cwmat.github.io/games-gallery/...`), since Pages serves the
  repo from a subpath rather than the domain root.
- **Hash routing** (`useHashRoute`, `#/gallery` vs. default) instead of
  path-based routing: GitHub Pages is static file hosting with no
  server-side rewrite rule, so a path route like `/gallery` would 404 on
  a hard refresh or a direct link. A hash never leaves the client, so
  `index.html` always serves regardless of what follows the `#`. This is
  a deliberate trade against a `404.html` redirect-trick SPA fallback: for
  a two-route site, hash routing is the simpler mechanism with the same
  ship-a-link guarantee.
- **`deploy.yml`** (GitHub Actions): on push to `main`, install with
  pnpm, run `pnpm gates:full` (lint, typecheck, test, build), upload the
  `dist/` build as a Pages artifact, and deploy via the standard
  `actions/deploy-pages` flow. A failing gate blocks the deploy step.
- **Pages enablement.** A fresh repo's Pages source defaults to "deploy
  from a branch," which the Actions-based flow above doesn't use. One-time
  setup switches it to the workflow build type:
  `gh api repos/cwmat/games-gallery/pages -X POST -f build_type=workflow`
  (or the equivalent Settings → Pages → Source → "GitHub Actions" UI
  step). Without this, `deploy.yml` can succeed and the site still 404s.

---

## 7. Testing and gates

- **`pnpm gates`** = `pnpm lint && pnpm typecheck && pnpm test` — the
  pre-push bar, enforced locally by the `.githooks` hook and in CI by
  `deploy.yml`.
- **`pnpm gates:full`** = `pnpm gates && pnpm build` — adds a production
  build check; this is the bar for anything that touches the deploy path.
- **Vitest runs in `node` environment**, not `jsdom` — the two contract
  modules under test are pure logic with no DOM dependency, so there's no
  reason to pay for a DOM shim.
- Four test files cover the pure-logic contracts:
  - `src/data/games.test.ts` — invariants on the `games` array itself:
    non-empty, unique ids, kebab-case ids, `url`/`repoUrl` are either
    `http(s)://` or `'#'`, non-empty `title`/`blurb`, `year` in
    `[2000, 2100]`, `accent` is a valid 6-digit hex color, and every
    `GameMedia` entry has non-empty `alt` text and a valid `src` (an
    `http(s)://` URL or a `assets/...`-relative path).
  - `src/game/layout.test.ts` — `corridorLayout()` against `count` = 0, 1,
    and several N: no lanterns / minimal width at 0, a single centered
    lantern at 1, the first lantern at `CORRIDOR_MARGIN` for larger
    counts, `LANTERN_SPACING` between consecutive lanterns, the
    `worldWidth = CORRIDOR_MARGIN * 2 + LANTERN_SPACING * (count - 1)`
    formula, and a strictly increasing `lanternXs` sequence.
  - `src/game/autopilot.test.ts` — `AutopilotController`: idles with no
    lanterns, walks toward the nearest unbroken lantern to the right,
    walks left when the only unbroken lantern is behind the player,
    attacks once in range then withholds during the retry cooldown,
    retries the attack after the cooldown expires instead of deadlocking
    on a whiff, cycles through all lanterns in order once every one is
    broken, wraps the carousel back to the first lantern after the last,
    and corrects facing (walks instead of attacking) before whipping a
    target that's in range but behind the player's current facing.
  - `src/bridge/events.test.ts` — the `Bridge` emitter: `on` receives
    `emit`ted payloads, `off` removes only the targeted listener (other
    listeners on the same event keep firing), `emit` on a void-payload
    event does not throw, and `getCurrentMode()` reflects the payload of
    the most recent `mode:changed` emit.
- No Phaser scene tests in v1 — scene behavior is verified by hand via the
  dev server; the pure math, the pure autopilot driver, the pure emitter,
  and the content invariants are what's cheap and valuable to pin down
  with unit tests.

---

## 8. Art pipeline

All art shares one contract: the `TEX` key map in
`src/game/placeholderArt.ts`. *(Amended 2026-08-30: the PixelLab art pass
landed — see design doc §7 and the `pixel-art-pipeline` skill for the
shipped state.)*

```
TEX.player         76 x 76 cells   public/assets/player.png (spritesheet,
                                   layout in PLAYER_SHEET: rotations row +
                                   east idle/whip/jump/walk rows)
TEX.lantern        32 x 48         public/assets/lantern.png
TEX.lanternBroken  32 x 48         public/assets/lantern-broken.png
TEX.floor          64 x 64         public/assets/floor.png
TEX.pillar         48 x 256        public/assets/pillar.png
TEX.wall          320 x 256        public/assets/wall.png (parallax bg)
TEX.spark           4 x 4          procedural (particle)
TEX.glow           64 x 64         procedural (accent-tinted halo)
```

Shipped keys are loaded in `CorridorScene.preload` (paths prefixed with
`import.meta.env.BASE_URL`); `createPlaceholderTextures(scene)` now bakes
only the two procedural keys. There is no `TEX.whip` texture: the whip
lash is drawn inside the player's whip animation frames, and the hit test
is purely positional (design doc §3.3).

The `pixel-art-pipeline` skill (§3.3, skill 4) owns regeneration and
additions: PixelLab REST v2 or MCP, dark-gothic palette lock (`#0b0a12`
background, `#f6b26b` amber, `#8b5cf6` purple; each game's `accent` tints
the procedural glow and spark burst, never the lantern art itself).

---

## 9. Assumptions and to-verify

- **`.mcp.json` env expansion.** The PixelLab MCP server config is expected
  to reference `PIXELLAB_SECRET` via `${PIXELLAB_SECRET}`-style header
  expansion rather than a literal committed secret. Verify this actually
  resolves with `claude mcp list` (a configured-but-unresolved variable
  typically shows the server as present but failing to connect) before
  relying on it in the `pixel-art-pipeline` skill.
- **Subscription requirement.** The PixelLab MCP server may require an
  active PixelLab subscription to generate images, independent of whether
  the MCP connection itself succeeds — a connected-but-quota-rejected
  state is a distinct failure mode to check for, not assume away.
- **Where the env var must live.** `PIXELLAB_SECRET` must be set in the
  **shell environment that launches Claude Code**, not merely in a
  project `.env` file — MCP server config expansion happens at Claude
  Code startup, before Vite or any app-level `.env` loading ever runs.
  `.env.example` in the repo root documents the variable name for that
  shell setup; it is not itself sufficient to make the MCP server work.
