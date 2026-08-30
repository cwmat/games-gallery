---
name: git-workflow
description: Branch, commit, PR, gate, and merge conventions for this repo — use for any git or gh operation.
---

# Git workflow

## Branch

- Always branch from fresh main, never from a stale local checkout:
  `git fetch origin && git switch -c feature/<slug> origin/main`
- Prefixes: `feature/` (new capability), `chore/` (tooling, deps, docs infra),
  `bug/` (fixes). Never commit directly to `main`.

## Commit

- Conventional commits: `feat|fix|chore|docs|test|ci|refactor(scope): summary`.
  Repo examples:
  - `feat(game): add whip hit detection for lantern corridor`
  - `feat(data): add Skeleton Tycoon placeholder entry`
  - `ci: add GitHub Pages deploy workflow`
  - `docs(work-log): record 2026-08-30 corridor layout math`
- Commit in small logical units as the work lands — data edit, game change,
  bridge change, tests can each be their own commit. Never one squash blob at
  the end.

## Gates before push

- `pnpm gates` (lint, typecheck, vitest) must pass locally before every push.
  The pre-push hook enforces this.
- NEVER use `--no-verify`. If a gate fails, fix the cause — do not bypass.
- Never force-push a shared branch.

## Pull request

- Open with:
  `gh pr create --title "<type>: <summary>" --body "<body>"`
- Body must contain: a summary of the change, gate evidence (`pnpm gates`
  output confirmation, `pnpm gates:full` if the PR touches the build), and
  playtest notes when the PR touches the React or Phaser UI — drive it
  through the dev launch profile (`.claude/launch.json`, port 5173, path
  `/games-gallery/`) and note a clean console.
- IMMEDIATELY after creation, share the PR link with the user. Not optional,
  not deferred to the end of the turn.

## CI watch

- CI checks can take ~30s to register. After creating the PR:
  1. Wait ~30 seconds.
  2. `gh pr checks <n> --watch`
  3. If it reports "no checks reported", that is NOT a failure — wait and
     retry, up to ~2 minutes total, before investigating.

## Merge

- Merge ONLY on green CI. Then:
  `gh pr merge <n> --merge --delete-branch`
- Always a merge commit (`--merge`) — merge commits preserve history.
  Never squash, never rebase-merge.
