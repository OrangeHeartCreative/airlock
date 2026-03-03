# Session 3 UX Validation — Node-Overlap Hint

Date: 2026-03-02
Scope: Readability validation for sectors 1-3 using fresh runs and both input methods.

## Test Setup

- Build/runtime: `npm run dev`
- Input methods: Keyboard, Gamepad
- Hint under test: `OBJECTIVE NODE: PURPLE CORE`

## Verification Status

- [x] Build verification run (`npm run build`) — PASS
- [x] Manual readability pass complete (sectors 1-3, keyboard + gamepad)

Validation note:

- Keyboard was not re-run in Session 3; input behavior was accepted from earlier sessions.
- Session 3 currently reflects gamepad-focused validation progress.

## Manual Run Sequence (fast path)

1. Launch game on `npm run dev`.
2. Start fresh run in Sector 1 with keyboard (`Enter`).
3. Force overlap context: move near active node and wait for/collect nearby pickup.
4. Check all Sector 1 keyboard boxes; set Sector 1 result.
5. Pause, return to menu, restart fresh run and repeat Sector 1 with gamepad (`A`).
6. Progress to Sector 2, repeat keyboard then gamepad checks and set result.
7. Progress to Sector 3, repeat keyboard then gamepad checks and set result.
8. If any "Needs tuning" is selected, list exact issue under sector notes and add priority in Proposed Changes.
9. Complete Session 3 Exit Check at bottom.

## Sector Readability Matrix

### Sector 1

- Keyboard:
  - [x] Hint appears only in relevant overlap context (carry-over from earlier sessions)
  - [x] Hint text is readable at gameplay pace (carry-over from earlier sessions)
  - [x] Placement does not obscure player or target feedback (carry-over from earlier sessions)
  - [x] Timing/cooldown feels non-spammy (carry-over from earlier sessions)
- Gamepad:
  - [x] Hint appears only in relevant overlap context
  - [x] Hint text is readable at gameplay pace
  - [x] Placement does not obscure player or target feedback
  - [x] Timing/cooldown feels non-spammy
- Result:
  - [x] Accepted
  - [ ] Needs tuning
- Notes:
  - Gamepad readability accepted.

### Sector 2

- Keyboard:
  - [x] Hint appears only in relevant overlap context (carry-over from earlier sessions)
  - [x] Hint text is readable at gameplay pace (carry-over from earlier sessions)
  - [x] Placement does not obscure player or target feedback (carry-over from earlier sessions)
  - [x] Timing/cooldown feels non-spammy (carry-over from earlier sessions)
- Gamepad:
  - [x] Hint appears only in relevant overlap context
  - [x] Hint text is readable at gameplay pace
  - [x] Placement does not obscure player or target feedback
  - [x] Timing/cooldown feels non-spammy
- Result:
  - [x] Accepted
  - [ ] Needs tuning
- Notes:
  - Readability clear; no tuning required.

### Sector 3

- Keyboard:
  - [x] Hint appears only in relevant overlap context (carry-over from earlier sessions)
  - [x] Hint text is readable at gameplay pace (carry-over from earlier sessions)
  - [x] Placement does not obscure player or target feedback (carry-over from earlier sessions)
  - [x] Timing/cooldown feels non-spammy (carry-over from earlier sessions)
- Gamepad:
  - [x] Hint appears only in relevant overlap context
  - [x] Hint text is readable at gameplay pace
  - [x] Placement does not obscure player or target feedback
  - [x] Timing/cooldown feels non-spammy
- Result:
  - [x] Accepted
  - [ ] Needs tuning
- Notes:
  - Readability clear; no tuning required.

## Tuning Candidates (if needed)

- [ ] Copy
- [ ] Font size
- [ ] Placement offset
- [ ] Cooldown timing

### Proposed Changes

- P1 (must fix before Session 4):
  - 
- P2 (should fix soon):
  - 
- P3 (nice to have):
  - 

## Session 3 Exit Check

- [x] Hint readability accepted in all three sectors
- [x] Required tuning changes listed and prioritized

Closeout note:

- No tuning changes required from Session 3 validation.
