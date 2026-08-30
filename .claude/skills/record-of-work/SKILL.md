---
name: record-of-work
description: Append the mandatory work-log entry when a task completes; a task without a log entry is not done.
---

# Record of Work

Invoke at the end of every task, before the PR is considered complete.
Both files below ship in the SAME PR as the work they describe.

## 1. Write the entry

Create `docs/work-log/YYYY-MM-DD-<slug>.md` (today's date, kebab-case slug
matching the branch slug where possible). Hard cap: 40 lines. It is a
record, not an essay — terse bullets, no narrative.

Template:

```markdown
# <Task title>

- **Task:** <one-two line summary of what was asked and what shipped>
- **Spec §§:** GAME_DESIGN.md §x.y, TECH_SPEC.md §x.y <exact sections touched>
- **Files changed:** <paths, grouped: data / game / app / docs>
- **Decisions:** <each decision + one-line rationale>
- **DEVIATIONS FROM SPEC:** <FLAG LOUDLY — what, why, and whether the spec
  was updated in this PR. Write "none" explicitly if none.>
- **Tests/gates:** <paste `pnpm gates` outcome — actual output, not
  "passed presumably">
- **Follow-ups:** <deferred items, or "none">
```

If subagents were fanned out (`tiered-fanout`), include the tier
assignments and review verdicts in Decisions.

## 2. Update the index

Append the one-liner to `docs/work-log/INDEX.md`, NEWEST FIRST (insert at
the top of the list), format:

```
YYYY-MM-DD — <slug> — <spec §§> — <outcome one-liner>
```

## 3. Checklist before calling it done

- [ ] Entry file exists, ≤40 lines, all template fields present
- [ ] Deviations section is explicit ("none" or loudly flagged)
- [ ] Test/gates results are real output, recorded
- [ ] INDEX.md line added at the top
- [ ] Both files committed in the same PR as the work
