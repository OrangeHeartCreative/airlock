# Next Milestone Plan

## Milestone Status

- Status: Closed (2026-03-02)
- Outcome: Scope delivered without expansion; all planned sessions complete.
- Summary: See `docs/milestone-next-summary.md`.
- Handoff: See `docs/milestone-next-handoff.md`.

## Milestone Goal

Ship a polished, testable post-MVP build that improves gameplay readability and technical reliability without expanding feature scope.

## Scope (In)

### 1) UX Clarity (P1)

- Add optional node-overlap hint so objective nodes are visually distinct from pickups.
- Keep this hint minimal and non-intrusive (toggleable or contextual only).
- Verify readability in sectors 1-3 using keyboard and gamepad.

### 2) Stability Regression Pass (P1)

- Re-run focused regression on:
  - Pause/resume/restart input flow (keyboard + gamepad)
  - Sector transitions (`GameScene -> SectorCompleteScene -> GameScene`)
  - Death flow to `GameOverScene` and restart to sector 1
- Confirm no soft-locks, stuck inputs, or double-transition edge cases.

### 3) Packaging Readiness (P2)

- Keep `npm run build` green.
- Run quality analysis sweep before milestone handoff.
- Document known non-blockers (for example, bundle-size warning) in release notes.

### 4) Performance Follow-up (P3)

- Evaluate bundle splitting options to reduce the current large chunk warning.
- If low-risk, apply minimal chunking improvement; otherwise track as deferred tech debt.

## Scope (Out)

- No compact sector summary panel.
- No new gameplay loops, enemies, or weapon systems in this milestone.
- No broad UI redesign beyond the node-overlap clarity hint.

## Deliverables

- Updated gameplay implementation for node-overlap clarity hint.
- Updated test checklist/results for regression pass.
- Updated docs:
  - `docs/todo-next-session.md` (carry-over + completions)
  - milestone summary notes for handoff

## Definition of Done

- Node-overlap hint implemented and validated in sectors 1-3.
- Regression checklist passes on keyboard and gamepad.
- Build and quality checks pass.
- Remaining risks/non-blockers documented explicitly.

## Execution Schedule

- Use `docs/milestone-next-schedule.md` as the step-by-step execution plan for this milestone.
