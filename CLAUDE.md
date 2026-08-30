# Games Gallery — Agent Operating Rules

Castlevania-style game resume: a corridor of lanterns, each one a project.
Whip a lantern and a project card rises out of it. Deployed FREE to GitHub
Pages — everything must stay a static build. Every session and subagent
inherits these rules.

## Repo map (read this, then fetch only what you need)

| Construct | Where | How to consume cheaply |
|---|---|---|
| Design truth | `docs/GAME_DESIGN.md` | Read only the §§ your task touches |
| Architecture truth | `docs/TECH_SPEC.md` | Same — by section |
| Project memory | `docs/work-log/INDEX.md` | Read the index; open only relevant entries |
| ALL game-project content | `src/data/games.ts` | Edit the typed array; `pnpm test` validates invariants |
| Phaser world | `src/game/` | Derives everything from `games.ts` + `config.ts` — never hard-code |
| React shell | `src/App.tsx`, `src/components/` | Views over the bridge and `games.ts` only |
| Bridge | `src/bridge/events.ts` | The ONLY Phaser-React channel |
| Placeholder-art contract | `src/game/placeholderArt.ts` | `TEX` keys — swap art via the `pixel-art-pipeline` skill |
| Workflow skills | `.claude/skills/` | Invoke per task type |
| Dev profile | `.claude/launch.json` | dev profile, port 5173; navigate to /games-gallery/ after it opens |
| Live build | <https://cwmat.github.io/games-gallery/> | `main` auto-deploys via GitHub Actions |

## Rules

1. **Source of truth.** `docs/GAME_DESIGN.md` (design) and
   `docs/TECH_SPEC.md` (architecture) govern. Spec changes precede code —
   edit the doc in the same PR, before the code. If docs and code disagree,
   the docs win and the code is the bug.
2. **Data-driven content.** Every game fact (title, blurb, description,
   media, url, tags, year, status, accent) lives in `src/data/games.ts` —
   never hard-coded elsewhere. The corridor, its lanterns, and the gallery
   grid all derive from that array; adding a game is one typed entry.
3. **Static-only deploy.** No server code, no runtime secrets. Respect the
   Vite base `/games-gallery/` in every asset/link path. `PIXELLAB_SECRET`
   is a dev-time-only env var for the art pipeline — it must never end up
   in the shipped bundle.
4. **Record of work.** A task is not done until a dated entry lands in
   `docs/work-log/YYYY-MM-DD-<slug>.md` and its one-liner is appended to
   `docs/work-log/INDEX.md`. Use the `record-of-work` skill.
5. **Model tiering + adversarial review.** Right-size EVERY spawned
   subagent/workflow agent with an explicit model — never inherit the
   main-loop model by default: `haiku` = mechanical (data authoring,
   boilerplate, test scaffolds, formatting); `sonnet` = feature
   implementation on established patterns; `opus` = architecture, balance
   judgment, review, adversarial verification; main-loop model = reserved
   for orchestration/synthesis in the main loop itself. Every fanned-out
   work product gets adversarial review by a model at least one tier above
   its producer before merge — findings or an explicit "none", never a
   rubber-stamp summary. Two failed reviews or a stall → re-tier upward
   instead of retrying. Use the `tiered-fanout` skill.
6. **Validation gates.** `pnpm gates` (lint, typecheck, vitest) must pass
   locally before any push — the pre-push hook enforces it; never bypass
   with `--no-verify`. CI must be green before any merge, and CI runs
   `pnpm gates:full` (adds `build` on top of `gates`) — a merge requires
   the full build to pass in CI, not just the local pre-push subset. PRs
   touching the React or Phaser UI additionally get a quick in-browser
   playtest via the dev launch profile (`.claude/launch.json`) with a
   clean console before the PR opens.
7. **Git conventions.** Branches `feature/*`, `chore/*`, `bug/*` off
   `main`; never commit to `main` directly. Conventional commits
   (`feat|fix|chore|docs|test|ci|refactor(scope): summary`). PRs via
   `gh pr create`; always share the PR link with the user immediately.
   Merge only on green CI: `gh pr checks <n> --watch` then
   `gh pr merge <n> --merge --delete-branch`. Details in the
   `git-workflow` skill.
8. **Bridge discipline.** Phaser and React talk ONLY through
   `src/bridge/events.ts`. `src/bridge/events.ts` and `src/game/config.ts`
   must never import Phaser — this keeps the gallery chunk Phaser-free for
   the lazy-loaded route split.
9. **Tooling notes.** Phaser stays on the 3.x line. pnpm 10 prints
   "Ignored build scripts" warnings — expected. Hash routing only
   (`useHashRoute`) — no react-router.
