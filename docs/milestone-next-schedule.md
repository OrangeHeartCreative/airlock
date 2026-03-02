# Next Milestone Schedule

Start date: 2026-03-02

Tracker key:

- [ ] Not started
- [x] Complete

## Timeline (7 Working Sessions)

### Session 1 — Planning + Baseline (60-90 min)

- [ ] Re-read `docs/milestone-next.md` and confirm in/out scope.
- [ ] Create a short implementation note for the node-overlap hint approach.
- [ ] Run baseline build check (`npm run build`).
- [ ] Run quality analysis sweep.
- [ ] Capture baseline findings and known non-blockers.

Exit criteria:

- [ ] Scope is frozen for this milestone.
- [ ] Baseline build/quality status is documented.

### Session 2 — Implement Node-Overlap Hint (90-120 min)

- [ ] Implement minimal optional node-overlap hint in gameplay HUD/feedback.
- [ ] Ensure behavior is non-intrusive and does not alter core combat flow.
- [ ] Smoke-test keyboard and one gamepad.

Exit criteria:

- [ ] Hint is working in-sector without UI clutter.
- [ ] No regressions in node/pickup interactions.

### Session 3 — UX Validation Pass (60-90 min)

- [ ] Validate readability of the hint across sectors 1-3.
- [ ] Test with keyboard and gamepad from fresh runs.
- [ ] Capture any tuning tweaks needed (copy/size/placement/timing).

Exit criteria:

- [ ] Hint readability accepted in all three sectors.
- [ ] Any required tuning changes are listed and prioritized.

### Session 4 — Stability Regression A (75-105 min)

- [ ] Stress-test pause/resume/restart flow under rapid input.
- [ ] Re-run transition loop repeatedly (`GameScene -> SectorCompleteScene -> GameScene`).
- [ ] Validate no input lock, double transition, or stuck state.

Exit criteria:

- [ ] Transition and pause flows pass stress checks.
- [ ] No blocking stability regressions remain.

### Session 5 — Stability Regression B (60-90 min)

- [ ] Validate death flow repeatedly (death delay -> `GameOverScene` -> restart sector 1).
- [ ] Re-test StartScene selection rules and pause menu navigation.
- [ ] Confirm behavior across at least two gamepad hardware profiles (if available).

Exit criteria:

- [ ] Death/restart flow is consistently correct.
- [ ] Menu interaction remains stable across input devices.

### Session 6 — Packaging + Performance Follow-up (60-90 min)

- [ ] Run `npm run build`.
- [ ] Run quality analysis sweep.
- [ ] Review bundle-size warning and attempt low-risk chunking improvement only if straightforward.
- [ ] If chunking change is risky, log as deferred tech debt.

Exit criteria:

- [ ] Release-candidate build succeeds.
- [ ] Performance warning disposition is documented (fixed or deferred).

### Session 7 — Milestone Closeout (45-75 min)

- [ ] Update `docs/todo-next-session.md`.
- [ ] Update `docs/milestone-next.md`.
- [ ] Write a short milestone summary (completed scope, deferred items, known non-blockers).
- [ ] Prepare handoff notes for next milestone.

Exit criteria:

- [ ] Definition of done in `docs/milestone-next.md` is satisfied.
- [ ] Handoff notes are complete and unambiguous.

## Suggested Calendar Mapping

- [ ] Day 1: Sessions 1-2
- [ ] Day 2: Session 3
- [ ] Day 3: Session 4
- [ ] Day 4: Session 5
- [ ] Day 5: Sessions 6-7

## Risk Buffer

- [ ] Keep one extra half-session buffer for unexpected regressions.
- [ ] If blocked, prioritize P1 stability over P3 performance follow-up.
