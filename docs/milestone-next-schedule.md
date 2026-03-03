# Next Milestone Schedule

Start date: 2026-03-02

Tracker key:

- [ ] Not started
- [x] Complete

## Timeline (7 Working Sessions)

### Session 1 — Planning + Baseline (60-90 min)

- [x] Re-read `docs/milestone-next.md` and confirm in/out scope.
- [x] Create a short implementation note for the node-overlap hint approach.
- [x] Run baseline build check (`npm run build`).
- [x] Run quality analysis sweep.
- [x] Capture baseline findings and known non-blockers.

Exit criteria:

- [x] Scope is frozen for this milestone.
- [x] Baseline build/quality status is documented.

Session 1 notes (2026-03-02):

- Scope freeze confirmed against `docs/milestone-next.md` (no scope expansion).
- Node-overlap hint approach documented in `docs/node-overlap-hint-implementation-note.md`.
- Baseline build: success (`npm run build`).
- Baseline quality sweep (Codacy CLI): no issues reported.
- Known non-blocker: Vite large chunk warning remains (>500 kB), already tracked for Session 6 performance follow-up.

### Session 2 — Implement Node-Overlap Hint (90-120 min)

- [x] Implement minimal optional node-overlap hint in gameplay HUD/feedback.
- [x] Ensure behavior is non-intrusive and does not alter core combat flow.
- [x] Smoke-test keyboard and one gamepad.

Exit criteria:

- [x] Hint is working in-sector without UI clutter.
- [x] No regressions in node/pickup interactions.

Session 2 progress notes (2026-03-02):

- Added contextual overlap hint in `src/scenes/GameScene.js` with low-frequency checks and cooldown.
- Hint only appears during node phase and only when player is near an active node with a nearby pickup.
- Build verification passed (`npm run build`).
- Smoke test checklist prepared in `docs/session-2-smoke-test.md`.
- Manual smoke test PASS recorded (keyboard + gamepad).

### Session 3 — UX Validation Pass (60-90 min)

- [x] Validate readability of the hint across sectors 1-3.
- [x] Test with keyboard and gamepad from fresh runs.
- [x] Capture any tuning tweaks needed (copy/size/placement/timing).

Exit criteria:

- [x] Hint readability accepted in all three sectors.
- [x] Any required tuning changes are listed and prioritized.

Session 3 progress notes (2026-03-02):

- UX validation worksheet prepared in `docs/session-3-ux-validation.md`.
- Build verification complete (`npm run build`).
- Keyboard validation treated as carry-over from earlier sessions (not re-run in Session 3).
- Sector 1 gamepad readability accepted.
- Sector 2-3 gamepad readability accepted.
- Tuning disposition: no changes required.

### Session 4 — Stability Regression A (75-105 min)

- [x] Stress-test pause/resume/restart flow under rapid input.
- [x] Re-run transition loop repeatedly (`GameScene -> SectorCompleteScene -> GameScene`).
- [x] Validate no input lock, double transition, or stuck state.

Exit criteria:

- [x] Transition and pause flows pass stress checks.
- [x] No blocking stability regressions remain.

Session 4 progress notes (2026-03-02):

- Stability worksheet prepared in `docs/session-4-stability-regression.md`.
- Hybrid approach confirmed: build/quality/logging can be automated, but rapid interaction and gamepad edge-case validation remain manual.
- Dev instrumentation added: `?qaSession5=1` plus `F9` summary dump/copy for faster regression logging.
- Session 4 result: PASS (no blocking regressions in pause/restart/transition stress checks).

### Session 5 — Stability Regression B (60-90 min)

- [x] Validate death flow repeatedly (death delay -> `GameOverScene` -> restart sector 1).
- [x] Re-test StartScene selection rules and pause menu navigation.
- [x] Confirm behavior across at least two gamepad hardware profiles (if available).

Exit criteria:

- [x] Death/restart flow is consistently correct.
- [x] Menu interaction remains stable across input devices.

Session 5 progress notes (2026-03-02):

- Stability worksheet prepared in `docs/session-5-stability-regression.md`.
- Existing QA instrumentation expanded to include death/game-over/restart and StartScene selector-rule signals.
- Use `?qaSession5=1` + `F9` summary to capture run evidence quickly during manual checks.
- Session 5 result: PASS (death/restart and menu stability checks clear).

### Session 6 — Packaging + Performance Follow-up (60-90 min)

- [x] Run `npm run build`.
- [x] Run quality analysis sweep.
- [x] Review bundle-size warning and attempt low-risk chunking improvement only if straightforward.
- [x] If chunking change is risky, log as deferred tech debt.

Exit criteria:

- [x] Release-candidate build succeeds.
- [x] Performance warning disposition is documented (fixed or deferred).

Session 6 progress notes (2026-03-02):

- Removed temporary in-game QA/debug instrumentation added for Session 4/5 (HUD QA lines, hotkey summary dump, scene-level metrics hooks).
- Added low-risk Vite manual chunking via `vite.config.js` to split `phaser` into a dedicated vendor chunk.
- Build remains successful.
- Bundle warning disposition: partially improved (main app chunk reduced; large chunk warning persists for `phaser` vendor chunk) and deferred as non-blocking tech debt.
- Quality analysis sweep (Codacy CLI): no issues reported.

### Session 7 — Milestone Closeout (45-75 min)

- [x] Update `docs/todo-next-session.md`.
- [x] Update `docs/milestone-next.md`.
- [x] Write a short milestone summary (completed scope, deferred items, known non-blockers).
- [x] Prepare handoff notes for next milestone.

Exit criteria:

- [x] Definition of done in `docs/milestone-next.md` is satisfied.
- [x] Handoff notes are complete and unambiguous.

Session 7 progress notes (2026-03-02):

- Closeout updates applied to `docs/todo-next-session.md` and `docs/milestone-next.md`.
- Milestone summary written in `docs/milestone-next-summary.md`.
- Handoff notes prepared in `docs/milestone-next-handoff.md`.
- Milestone marked closed.

## Suggested Calendar Mapping

- Planned (original):
	- [ ] Day 1: Sessions 1-2
	- [ ] Day 2: Session 3
	- [ ] Day 3: Session 4
	- [ ] Day 4: Session 5
	- [ ] Day 5: Sessions 6-7

- Actual execution (retrospective):
	- [x] Sessions 1-7 were executed on 2026-03-02 in a condensed single-day validation window due to focused availability and no blocker regressions during the run.

## Risk Buffer

- [ ] Keep one extra half-session buffer for unexpected regressions.
- [ ] If blocked, prioritize P1 stability over P3 performance follow-up.
