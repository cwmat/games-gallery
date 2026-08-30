# Games Gallery

A playable resume — whip a lantern, a game project card falls out. A
gothic Castlevania corridor built in Phaser inside a React shell, one
breakable lantern per project in `src/data/games.ts`, with a plain
accessible grid fallback at `#/gallery` for anyone who'd rather skip the
hallway.

**▶ Play: <https://cwmat.github.io/games-gallery/>**

- **Design:** [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) (corridor, whip,
  cards, autoplay — source of truth)
- **Architecture:** [docs/TECH_SPEC.md](docs/TECH_SPEC.md)
- **Agent workflow:** [CLAUDE.md](CLAUDE.md) + [.claude/skills/](.claude/skills/)

## Quick start

```sh
pnpm install
pnpm dev          # app on http://localhost:5173
pnpm gates        # lint + typecheck + test (pre-push gate)
```

Adding a game is one entry in [src/data/games.ts](src/data/games.ts) — the
corridor, the resume card, and the gallery grid all derive from it, no
other files to touch.

Art is placeholder-shape programmer art until the `pixel-art-pipeline`
skill swaps it for real pixel art via PixelLab; see `.env.example` for the
required `PIXELLAB_SECRET`.
