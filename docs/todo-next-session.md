# Next Session TODO

## Carry Over (Next Session Focus)

- [ ] Add optional node overlap hint if players confuse nodes with pickups again

## Completed This Session

- [x] Full playtest pass across sectors 1-3 (keyboard and gamepad)
- [x] Verify no node/enemy soft-locks in narrow corridors
- [x] Re-check pause/resume/restart behavior under rapid gamepad input
- [x] Confirm pickup timing grace still prevents same-frame HP loss
- [x] Validate sector transition flow (`GameScene` -> `SectorCompleteScene` -> `GameScene`) repeatedly
- [x] Tune enemy spawn clearance around active nodes (`ENEMY_NODE_SPAWN_CLEARANCE_PX`)
- [x] Balance node health and per-sector node count scaling
- [x] Adjust enemy cap scaling per sector (`maxActiveEnemies`) if pressure spikes too hard
- [x] Re-evaluate pickup frequency and lifespan for longer sectors
- [x] Consider adding a minimal objective line to HUD for faster QA context
- [x] Decide whether to keep runtime debug overlay always on or behind a debug flag
- [x] Remove unused legacy fields if no longer needed (`resources.keys`, boss-related remnants)
- [x] Add lightweight constants comments for tuning parameters
- [x] Run one final lint/quality sweep before packaging next milestone
- [x] Add a basic generated "next sector" layout variation instead of static maze re-use
- [x] Confirm `GameOverScene` always appears after death delay and restart returns to Sector 1
- [x] Re-test Pause menu navigation/selection with left stick on multiple gamepads
- [x] Verify StartScene selector behavior remains Enter + A only (no Start-button selection)
- [x] Final readability check for enlarged HUD/objective checklist across sectors 1-3
