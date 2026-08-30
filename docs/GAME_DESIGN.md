# Games Gallery — Game Design

Companion to `TECH_SPEC.md`. Covers the corridor scene, the resume-card
interaction, attract mode, and the plain-React gallery fallback.

---

## 1. Concept

It's a résumé. You whip it until it falls out of a lantern.

**Games Gallery** is a portfolio site disguised as a Castlevania stage
select: one long gothic corridor, one hanging lantern per project, and a
player-character whose entire job is to walk down the hall breaking things
open. Shatter a lantern and a "resume card" drops out — title, blurb,
description, tags, media, and a link to go play the actual thing. It is
self-aware about being a gimmick: the tone is dry and a little proud of
itself, the way a portfolio piece is allowed to be when the portfolio piece
*is* the joke and the demonstration of skill at the same time.

Two entry points share one content source (`src/data/games.ts`):

- **The corridor** (`#` / default route) — the Phaser experience described
  in §2–§5. This is the demo reel: it proves the author can wire a game
  engine into a web app, drive it from typed state, and make it hold up
  under both a keyboard and an idle attract loop.
- **The gallery** (`#/gallery`) — a plain, boring, fast, accessible grid of
  the same cards (§6), for anyone who would rather not walk down a hallway
  to read a bullet list.

Nobody is required to enjoy the bit. The gallery exists specifically so
nobody has to.

---

## 2. The corridor

### 2.1 Layout

The corridor is a single horizontal strip. Its geometry is pure math, not
hand-placed level data, so it scales automatically as `games.ts` grows —
adding a game adds a lantern, not a level-design pass.

`corridorLayout(count)` (contract in `src/game/config.ts`):

- Lanterns sit `LANTERN_SPACING` (480px) apart, the first one
  `CORRIDOR_MARGIN` (640px) in from the left wall.
- `worldWidth = CORRIDOR_MARGIN * 2 + LANTERN_SPACING * (count - 1)` — the
  same margin is mirrored on the right, so the last lantern is never
  crowded against the far wall.
- `count === 0`: no lanterns, `worldWidth` collapses to `CORRIDOR_MARGIN * 2`
  (a walkable but empty hall — the honest state for an empty `games.ts`).
- `count === 1`: one lantern, dead center, `worldWidth = CORRIDOR_MARGIN * 2`
  (spacing term drops to zero rather than adding a phantom gap).

Worked example at the current seed count (5 entries):

| i | lanternX |
|---|---|
| 0 | 640 |
| 1 | 1120 |
| 2 | 1600 |
| 3 | 2080 |
| 4 | 2560 |

`worldWidth = 1280 + 480 * 4 = 3200`.

### 2.2 Camera and scale

The Phaser canvas is fixed at `GAME_WIDTH x GAME_HEIGHT` (960x540) and
scales to fit its container (letterboxed, not stretched) so the pixel-art
era of the art pass reads crisply at any window size. On top of that, the
camera runs at `CAMERA_ZOOM` (1.5x) for chunky Castlevania framing — the
character reads large on screen instead of as a distant figure. The camera
follows the player horizontally with world bounds clamped to
`[0, worldWidth]`; vertically the corridor never scrolls — one floor, one
row of lanterns, no verticality in v1 (see §9).

Presentation: Phaser's `CENTER_BOTH` is the single centering authority
(the `.game-canvas` wrapper is a plain block — CSS flex/grid centering on
top of Phaser's margins double-centers and shoves the canvas sideways).
The letterbox gutters carry a slow dark aurora (layered indigo/slate/ember
radial gradients drifting on a ~26s loop, disabled under
`prefers-reduced-motion`), and the canvas edges fade into it via an
intersection of two linear-gradient CSS masks (fade width per edge is the
`--canvas-fade` custom property, currently 8%) so the frame has no hard
rectangle border. A radial ellipse mask specifically does not work for
this — its percentage radii resolve against the full box dimensions, which
parks the fade ring outside the canvas entirely.

### 2.3 HUD

A persistent HUD (`src/components/Hud.tsx`) sits over the corridor
whenever the default route is active — plain React chrome laid on top of
the Phaser canvas, not part of the scene:

- **Title** — "Games Gallery," so the corridor doesn't need in-canvas
  title art of its own.
- **Autoplay toggle** — a button reading "Autoplay: on/off" that flips
  `mode` between `'auto'` and `'manual'` by emitting the same
  `mode:changed` bridge event the takeover keys use (§5.3).
- **Gallery view link** — `#/gallery`, the escape hatch to the plain grid
  (§6) for anyone who'd rather not walk the hallway.
- **Controls hint** — a static line ("Arrows/AD move · Up/W jumps ·
  Space/X whips") so the control scheme (§3.1) doesn't have to be
  discovered by trial and error.

---

## 3. Player and whip

### 3.1 Controls

| Input | Action |
|---|---|
| `←` / `→` or `A` / `D` | Walk |
| `↑` or `W` | Jump |
| `Space` or `X` | Whip |

Both the keyboard and the autoplay driver (§5) write the same `InputState`
shape, so "what moves the character" is swappable without the scene caring
which source is live.

### 3.2 Movement feel targets

Castlevania-stiff, not metroidvania-fluid — this is the point, not a
limitation:

- Walk is constant-speed, no acceleration ramp, no air control beyond
  minimal drift. Turning around is instant-facing but not instant-momentum.
- Jump is a single fixed-height hop (no variable jump height, no double
  jump, no coyote-time generosity) — a *beat*, not a platforming challenge.
  There's nothing to fall into; jump exists for feel and for stepping over
  nothing in particular, in the best NES tradition.
- Whip has a short recovery window after each swing (no button-mashing into
  a machine-gun whip) so the shatter beat in §4 reads as a discrete event
  rather than a spray.

### 3.3 Whip arc and range

The whip is a horizontal reach attack in the player's facing direction,
`WHIP_RANGE` (90px) long. The lash is drawn inside the player's whip
animation frames (no separate whip texture), and the hit lands
`WHIP_HIT_DELAY_MS` (~300ms) after the swing starts so the strike frame
is actually visible before the scene pauses under the card.

The hit test is directional and computed relative to facing: for each
lantern, `dx = (lantern.x - player.x) * facing`, so a positive `dx` always
means "ahead of the player," on either facing side. A lantern registers a
hit when it is unbroken and `dx` falls between `-12` and `WHIP_RANGE + 20`
(i.e. -12px to +110px). The `-12` is a small grace band behind the
player's origin so a lantern right at their feet still registers even
mid-swing; the extra `+20` past `WHIP_RANGE` covers the swing's visual
reach past the strict range. Facing mirrors this band automatically —
flip facing and the accepted `dx` window flips with it — so a lantern on
the player's rear side is never in range and never registers a hit, no
matter how close it is. When more than one lantern falls in the band, the
nearest by `|dx|` is the one that gets hit (this is purely a horizontal
check, not a full AABB sweep). Lanterns hang on long ceiling chains down
to `LANTERN_Y` (`FLOOR_TOP_Y - 60`) — glass level with the player's
swing — so a hit looks like a hit; no jumping is ever required to reach
one. A grounded whip also plants the player's feet for the whole swing
(air whips keep their momentum), so the strike lands exactly where the
animation shows it.

---

## 4. Lanterns and cards

### 4.1 Shatter sequence

1. Whip hitbox overlaps an unbroken lantern within range.
2. Spark particles (`TEX.spark`, 4x4) burst from the lantern position.
3. The lantern's texture swaps `TEX.lantern` → `TEX.lanternBroken` — a grey
   husk, left standing (breaking a lantern doesn't delete it; the corridor
   should look the same on the walk back).
4. The scene emits `lantern:broken { gameId }` on the bridge (`src/bridge/events.ts`)
   and immediately pauses itself (`scene.pause()` or physics/time freeze —
   whichever the implementation lands on, the visible effect is "the
   corridor holds still while the card is up").
5. React owns the pause from here: it renders the resume card overlay and
   is responsible for sending `card:closed` when the player is done, at
   which point the scene resumes.

### 4.2 Card contents

The card is a direct, unfiltered render of one `GameEntry` (full field
list in §8):

- `title`, `blurb` — header treatment.
- `description` — body copy.
- `tags` — chip row.
- `media` — the FIRST entry is the card's 16:9 hero slot; videos are
  preferred there and autoplay muted (looped, with controls). Remaining
  entries render as a gallery below the blurb. An empty array renders a
  styled "gameplay footage soon" placeholder slot, so the layout is
  stable before footage exists.
- `url` — the primary "Visit game" call to action.
- `repoUrl` — secondary link, shown only when present.
- `accent` — tints the card's trim and the lantern's own glow prior to
  breaking, so the corridor gives a color hint about each entry before it's
  opened.

Closing the card (explicit close control, `Escape`, or autoplay's dwell
timer expiring — see §5) emits `card:closed`, which the scene treats purely
as "resume"; it does not care why the card closed.

### 4.3 Reopen behavior

A broken lantern is still whippable. Whipping an already-broken lantern
re-emits `lantern:broken` for the same `gameId` and reopens the card —
there is no one-time-only gate. It skips the texture-swap step (already
husked) but does still spawn a small spark burst — 4 particles, versus 16
for the initial shatter — so the re-hit still reads as a real swing
landing rather than a silent no-op, then runs the same pause → card →
`card:closed` → resume cycle. This keeps the interaction honest: the
corridor is a navigable list you can revisit, not a one-shot reveal.

---

## 5. Autoplay / attract mode

### 5.1 Why

A portfolio site with an idle corridor and nobody moving is a portfolio
site nobody experiences. Autoplay is the attract loop: it demonstrates the
whole interaction on its own, unattended, the way an arcade cabinet sells
itself between coin-drops.

### 5.2 The virtual-input driver

Autoplay is not a separate code path bolted onto the player controller —
it is a second producer of the exact same `InputState` the keyboard
produces. A small autopilot ticks each frame and decides "walk right,"
"jump" (cosmetic, optional), or "whip" the same way a human's keypresses
would, and the player entity consumes whichever `InputState` is currently
live without knowing the difference. This is why the bridge's `mode:changed`
event exists: it's the seam where the *source* of input state switches, not
where movement logic branches.

Behavior:

1. Walk right at normal speed.
2. On approaching an unbroken lantern within whip range, stop and whip it.
3. Once the card opens, autoplay's job is done for that lantern — it
   dwells (does nothing) for `CARD_AUTO_CLOSE_MS` (6000ms), then the card
   auto-closes and autoplay resumes walking right.
4. On reaching the rightmost lantern (or the corridor's end), wrap back to
   the leftmost unbroken — or, if everything's broken, leftmost — lantern
   and continue. The loop never dead-ends at the far wall.

### 5.3 Takeover

Only the actual game-control keys switch `mode` from `'auto'` to
`'manual'` via `mode:changed`: `←`/`→`/`↑`/`↓`, `A`/`D`/`W`, `X`, and
`Space`. Everything else — `Tab`, `Escape`, modifier keys, browser
shortcuts, anything not in that list — is deliberately ignored by the
takeover check, so tabbing through an open card's links or dismissing it
with `Escape` never accidentally kills autoplay out from under someone
who's just reading. Once a control key fires, autopilot stops issuing
input for the rest of the session. There is deliberately no "give control
back to autoplay after N seconds idle" — once a human is driving, autoplay
does not wrestle the wheel back.

### 5.4 Mobile default

`(pointer: coarse)` devices start in `'auto'` mode on load — a corridor you
can't comfortably keyboard through defaults to watching it play itself.
Tap-to-advance takes the place of dwell-waiting: a tap while a card is open
closes it immediately and lets autoplay continue, so mobile visitors can
pace through the whole gallery at their own speed without ever touching a
d-pad that doesn't exist.

### 5.5 Card engagement cancels auto-close

Hovering the pointer into an open card, or focusing into it via keyboard,
cancels that card's `CARD_AUTO_CLOSE_MS` dwell timer for as long as it
stays open — a visitor actively reading the card or tabbing through its
links has implicitly taken over from the timer, the same way a control
keypress takes over from autopilot movement (§5.3). The dwell timer only
ever fires on a card nobody has touched; once engaged, that card only
closes explicitly (close control or `Escape`), and closing it is what lets
autoplay resume walking.

---

## 6. Gallery view

### 6.1 What it is

`#/gallery` renders the same `games` array as a plain CSS grid of cards —
no canvas, no corridor metaphor, no autoplay. It is the fallback for
"just show me the list," and it is also the version that loads fastest,
since it never pulls in Phaser at all (`React.lazy` boundary — see
`TECH_SPEC.md` §4).

### 6.2 Accessibility

The gallery is a static grid, not a set of dialogs to open: every card
(`GameCard`, the same component the corridor's card overlay renders)
prints its full content inline, so there's nothing hidden and no extra
keyboard mode to learn:

- **Heading structure.** The page has one `<h1>` ("Games Gallery"); each
  card's title renders as an `<h2>` (`.game-card__title`) beneath it, so
  screen-reader users can jump card-to-card via heading navigation.
- **Keyboard.** Nothing needs to be "opened" — a card's interactive
  content (its "Visit game" / "Source" links) is reachable in document
  order via `Tab`, the same as any other link on the page. There's no
  focus trap and no `Escape` handler here because there's no modal to
  trap focus in or escape from.
- **Alt text.** Every `GameMedia` entry's `alt` is rendered as the real
  `alt` attribute — never dropped, never replaced with the game title as a
  lazy substitute.

The corridor's own card overlay (`CardOverlay.tsx`, opened by breaking a
lantern) is where real dialog semantics apply, because that surface
genuinely covers the corridor with a modal: `role="dialog"`,
`aria-modal="true"`, a focus trap, focus restored to the previously
focused element on close, and `Escape` to close. The gallery grid has no
equivalent overlay, so it has no equivalent dialog machinery — see §9 for
the click-to-open variant that isn't built yet.

---

## 7. Visual language

### 7.1 Shipped art (PixelLab pass, 2026-08-30)

Gothic pixel art generated via the `pixel-art-pipeline` skill
(`TECH_SPEC.md` §8 has the key/size table):

- Palette: background `#0b0a12`, warm amber lantern light `#f6b26b`,
  deep blue-grey stone. `image-rendering: pixelated` on the canvas.
- The vampire-hunter player character (east-facing animations: idle,
  walk, jump, whip; `flipX` covers west), lit + broken hanging lanterns,
  carved stone pillars, flagstone floor, and a dim arched-window wall on
  the slowest parallax layer.
- Per-game identity: each `GameEntry.accent` tints a procedural additive
  glow halo behind that game's lantern (with a slow desynced pulse) and
  the spark burst on shatter — the lantern art itself is never tinted.
  Broken lanterns lose their glow entirely.

### 7.2 Swap discipline

Everything is a swap-in-place asset keyed by `TEX`
(`src/game/placeholderArt.ts`), loaded from `public/assets/` in
`CorridorScene.preload`, never referenced by file path elsewhere in game
code. Regenerating or adding art (see the skill's wishlist) changes zero
call sites; only `spark` and `glow` stay procedural.

---

## 8. Content model

### 8.1 `GameEntry` fields

`src/data/games.ts` is the single source of truth for every game shown by
either view (full type contract lives in code; meanings below):

| Field | Meaning |
|---|---|
| `id` | Kebab-case, unique. The lantern's identity — this is the `gameId` carried on `lantern:broken`, so it's also the stable key for React lists and (future) deep links. |
| `title` | Card header. |
| `blurb` | One-liner, shown wherever space is tight (card header sub-line, gallery card front). |
| `description` | Full body copy for the opened card. |
| `media` | Ordered `{ kind, src, poster?, alt }[]`; may be empty. First entry = the card's hero slot (videos preferred; autoplay muted). `src`/`poster` are external URLs or `assets/...` paths served from `public/` — convention: `assets/media/<id>.mp4` (+ optional `assets/media/<id>.jpg` poster), 10-30s, ≤ ~10MB (Pages serves statically, no streaming). |
| `url` | The "Visit game" link — the primary reason the card exists. |
| `repoUrl` | Optional secondary link to source. |
| `tags` | Free-form chip strings (genre, engine, jam name, whatever's useful). |
| `year` | Shown as a small metadata line. |
| `status` | One of `'playable' \| 'wip' \| 'jam' \| 'archived'` — drives a small status badge; not currently used for filtering, but the type exists so filtering is a later UI-only change. |
| `accent` | CSS hex. Tints the lantern glow pre-shatter and the card trim post-shatter. |

### 8.2 Adding a game

Adding a game to the site is **one array entry** in `src/data/games.ts` —
no new components, no new routes, no lantern-placement work (§2.1 handles
that automatically as `games.length` changes). If the entry has no `media`
yet, ship it with `media: []`; the card shows its "gameplay footage soon"
placeholder slot until real footage lands.

---

## 9. Out of scope / follow-ups

Deliberately not in v1, so the corridor stays a two-week portfolio piece
and not a game in its own right:

- **Sound.** No SFX, no music, no whip-crack, no shatter chime. The whole
  experience is currently silent by omission, not by design intent —
  first thing to add if this becomes a longer-lived project.
- **Per-game deep links** (`#/gallery/:id` opening that card directly on
  load). Useful for sharing one project's card; not needed while the
  whole gallery is small enough to browse.
- **More rooms / secret alcoves.** The corridor is one straight hallway.
  Branching rooms, a secret wall, a boss door that doesn't open — all fun,
  all out of scope for a résumé.
- **Touch controls beyond tap-to-advance.** Mobile gets autoplay + tap
  (§5.4); it does not get an on-screen d-pad or whip button. If manual
  mobile play becomes a goal, that's a follow-up, not an oversight.
- **Click-to-open card dialogs in the gallery grid.** The gallery (§6.2)
  currently renders every card's full content inline with no open/close
  state; a dialog variant — click (or `Enter`/`Space` on a focused card)
  opens a `role="dialog"` overlay mirroring the corridor's `CardOverlay`,
  rather than always showing everything at once — is a plausible future
  layout change but isn't built.
