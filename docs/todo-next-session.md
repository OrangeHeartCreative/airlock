# Next Session TODO

## High Priority Stabilization

_Code hardening pass applied (pause/resume input guards, transition debounce, node placement safety, post-resume contact grace). Manual playtest validation items remain open._

- [ ] Full playtest pass across sectors 1-3 (keyboard and gamepad)
- [x] Verify no node/enemy soft-locks in narrow corridors
- [ ] Re-check pause/resume/restart behavior under rapid gamepad input
- [x] Confirm pickup timing grace still prevents same-frame HP loss
- [ ] Validate sector transition flow (`GameScene` -> `SectorCompleteScene` -> `GameScene`) repeatedly

## Gameplay Tuning

- [x] Tune enemy spawn clearance around active nodes (`ENEMY_NODE_SPAWN_CLEARANCE_PX`)
- [x] Balance node health and per-sector node count scaling
- [x] Adjust enemy cap scaling per sector (`maxActiveEnemies`) if pressure spikes too hard
- [x] Re-evaluate pickup frequency and lifespan for longer sectors

## UX / Debugging Support

- [x] Consider adding a minimal objective line to HUD for faster QA context
- [ ] Add optional node overlap hint if players confuse nodes with pickups again
- [x] Decide whether to keep runtime debug overlay always on or behind a debug flag

## Technical Cleanup

- [ ] Remove unused legacy fields if no longer needed (`resources.keys`, boss-related remnants)
- [ ] Add lightweight constants comments for tuning parameters
- [ ] Run one final lint/quality sweep before packaging next milestone

## Stretch (If Time)

- [x] Add a basic generated "next sector" layout variation instead of static maze re-use
- [ ] Add a compact sector summary panel on completion (time survived, nodes destroyed)

## Added During This Session (Still To Verify)

- [ ] Confirm `GameOverScene` always appears after death delay and restart returns to Sector 1
- [ ] Re-test Pause menu navigation/selection with left stick on multiple gamepads
- [ ] Verify StartScene selector behavior remains Enter + A only (no Start-button selection)
- [ ] Final readability check for enlarged HUD/objective checklist across sectors 1-3
