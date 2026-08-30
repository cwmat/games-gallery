---
name: tiered-fanout
description: Classify work items and dispatch subagents at the lowest viable model tier, with mandatory higher-tier adversarial review.
---

# Tiered Fanout

Use when a task decomposes into 3+ work items or parallelizable work.
Every fanned-out product gets adversarial review before merge.

## 1. Classify each item (lowest viable tier)

Tiers map to concrete models. The main loop stays on its own (top) model
for orchestration and synthesis; every spawned agent gets an **explicit**
model — never inherit the top model by default (Agent tool `model` param,
Workflow `agent(..., {model, effort})`).

| Tier | Model | Work | Examples |
|---|---|---|---|
| cheap | `haiku` | Mechanical: no judgment needed | data JSON/TS authoring, boilerplate, test scaffolds, doc formatting, single-fact lookups |
| mid | `sonnet` | Implementation against existing patterns | features on established engine/app patterns, refactors with clear targets, straightforward finding-verification |
| top | `opus` | Judgment | architecture, balance interpretation, code review, adversarial verification |
| frontier | inherit (main-loop model) | Rare: needs the orchestrator's full judgment | final synthesis, novel design calls — usually stays IN the main loop rather than spawned |

When in doubt between two tiers, take the lower — escalation (below) is
the correction mechanism, not up-front pessimism. Reviews default to
`opus` reviewers with `sonnet`/`opus` verifiers; only escalate a reviewer
to the frontier tier when an opus review has already failed twice.

Record every assignment (item → tier → agent) in the work-log entry via
`record-of-work`.

## 2. Dispatch

Give each subagent: the exact spec §§, acceptance criteria, target branch,
and the CLAUDE.md rules. Subagents run `pnpm gates` (or the relevant
subset — lint/typecheck/vitest) on their own output before returning.

## 3. Adversarial review (mandatory)

Every work product is reviewed by a model AT LEAST ONE TIER ABOVE its
producer (top-tier products: reviewed top-tier by a different agent).

Review prompt template:

```
Adversarially review <files/diff> against GAME_DESIGN.md §<x>, TECH_SPEC.md
§<x>, and CLAUDE.md. Hunt for:
- spec violations (behavior diverging from GAME_DESIGN.md / TECH_SPEC.md
  cited sections)
- hard-coded content (game titles/urls/blurbs anywhere outside
  src/data/games.ts)
- data-driven breaks (scenes/gallery not deriving from games.ts — lantern
  counts, ordering, card fields)
- Pages incompatibility (server assumptions, secrets in client code, URLs
  ignoring the /games-gallery/ base, non-static fetches)
- bundle bloat (Phaser imported into bridge/config/gallery chunks breaking
  the lazy split; heavy assets in src/ instead of public/)
- a11y regressions in the React layer (overlay focus/Esc/dialog semantics,
  gallery alt text, keyboard reachability)
- missing tests (games.ts invariants, corridor layout math)

Output: a numbered list of findings with file:line and severity, or the
exact sentence "No findings." A summary of what the code does is a failed
review — verdicts only.
```

A rubber-stamp ("looks good", prose summary) does not count as a review —
re-run it.

## 4. Escalation

- 1 failed review → producer fixes at the same tier, re-review.
- 2 failed reviews on the same item, OR a stall (no progress / agent
  looping) → re-tier the item UPWARD and reassign. Never burn a third
  retry at the same tier.
- Log every escalation and its trigger in the work-log entry.
