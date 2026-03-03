# Content Expansion Milestone Schedule

Start date: 2026-03-02

Tracker key:

- [ ] Not started
- [x] Complete

## Timeline (8 Working Sessions)

### Session 1 — Baseline + Expansion Spec (60-90 min)

- [ ] Confirm final in-scope target: 9-sector minimum, 12-sector stretch.
- [ ] Define sector-band model (early/mid/late).
- [ ] Freeze which tuning knobs scale per band.
- [ ] Run baseline build + quality sweep.

Exit criteria:

- [ ] Expansion targets are explicit and frozen.
- [ ] Baseline checks documented.

### Session 2 — Layout Template Expansion A (90-120 min)

- [ ] Add first batch of new sector layout templates.
- [ ] Verify navigation and collision reliability on each new template.
- [ ] Smoke-test node placement viability.

Exit criteria:

- [ ] New templates load without blocker pathing/collision bugs.

### Session 3 — Layout Template Expansion B (90-120 min)

- [ ] Add remaining templates/variants to reach 9-sector minimum.
- [ ] Ensure sector sequence produces visible diversity.
- [ ] Validate safe-room and spawn logic on all variants.

Exit criteria:

- [ ] 9-sector minimum achieved.
- [ ] Sequence variety is accepted.

### Session 4 — Progression Scaling Pass (75-105 min)

- [ ] Implement/adjust early-mid-late scaling curves.
- [ ] Tune node count/health and enemy pressure by sector band.
- [ ] Tune pickup cadence/lifetime for longer runs.

Exit criteria:

- [ ] Progression feels continuous without abrupt spikes.

### Session 5 — Readability + UX Validation (60-90 min)

- [ ] Re-validate objective readability in expanded run length.
- [ ] Confirm node/pickup clarity still holds in later sectors.
- [ ] Capture required tuning tweaks.

Exit criteria:

- [ ] Readability accepted across expanded progression.

### Session 6 — Stability Regression Under Load (75-105 min)

- [ ] Re-run pause/resume/restart stress in later sectors.
- [ ] Re-run transition loops repeatedly across expanded set.
- [ ] Re-run death->game over->restart sector 1 checks.

Exit criteria:

- [ ] No blocker stability regressions under longer runs.

### Session 7 — Packaging + Performance Follow-up (60-90 min)

- [ ] Run `npm run build`.
- [ ] Run quality analysis sweep.
- [ ] Re-evaluate chunk warning and apply only low-risk changes if justified.
- [ ] Log deferred tech debt if warning persists.

Exit criteria:

- [ ] Build/quality pass.
- [ ] Performance warning disposition documented.

### Session 8 — Milestone Closeout (45-75 min)

- [ ] Update `docs/todo-next-session.md`.
- [ ] Write milestone summary and handoff notes.
- [ ] Confirm definition-of-done checklist.

Exit criteria:

- [ ] All closeout docs complete and unambiguous.

## Risk Buffer

- [ ] Reserve one half-session for integration regressions.
- [ ] If blocked, prioritize P1 content/stability over P3 packaging improvements.
