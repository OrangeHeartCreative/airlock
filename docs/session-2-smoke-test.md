# Session 2 Smoke Test — Node-Overlap Hint

Date: 2026-03-02
Build target: dev (`npm run dev`)

## Keyboard Pass

- [x] Start run with keyboard (`Enter` on StartScene).
- [x] Move with `WASD`; fire with `Space` (or mouse).
- [x] Reach an active node area where a pickup is nearby.
- [x] Confirm hint appears: `OBJECTIVE NODE: PURPLE CORE`.
- [x] Confirm hint does not spam continuously (cooldown behavior).
- [x] Confirm node can still be damaged/destroyed as normal.
- [x] Confirm pickup collection text still appears and resources update.
- [x] Confirm pause/resume works (`Esc`) with no input lock.

## Gamepad Pass

- [x] Start run with gamepad (`A` on StartScene, not Start/Menu button).
- [x] Move with left stick; fire with RT/RB.
- [x] Reach active node + nearby pickup overlap context.
- [x] Confirm same hint appears and remains brief/non-intrusive.
- [x] Confirm node/pickup interactions remain unchanged.
- [x] Confirm pause/resume works with pause button mapping.

## Regression Confirmation

- [x] No double-transition or stuck state observed.
- [x] No objective progress mismatch after node destruction.
- [x] No pickup collection regressions near nodes.

## Result

- [x] PASS
- [ ] FAIL (capture issue below)

Notes:

- Smoke pass confirmed by manual keyboard + gamepad run.
