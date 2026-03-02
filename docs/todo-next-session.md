# Next Session TODO

## High Priority Stabilization

- [ ] Full playtest pass across sectors 1-3 (keyboard and gamepad)
- [ ] Verify no node/enemy soft-locks in narrow corridors
- [ ] Re-check pause/resume/restart behavior under rapid gamepad input
- [ ] Confirm pickup timing grace still prevents same-frame HP loss
- [ ] Validate sector transition flow (`GameScene` -> `SectorCompleteScene` -> `GameScene`) repeatedly

## Gameplay Tuning

- [ ] Tune enemy spawn clearance around active nodes (`ENEMY_NODE_SPAWN_CLEARANCE_PX`)
- [ ] Balance node health and per-sector node count scaling
- [ ] Adjust enemy cap scaling per sector (`maxActiveEnemies`) if pressure spikes too hard
- [ ] Re-evaluate pickup frequency and lifespan for longer sectors

## UX / Debugging Support

- [ ] Consider adding a minimal objective line to HUD for faster QA context
- [ ] Add optional node overlap hint if players confuse nodes with pickups again
- [ ] Decide whether to keep runtime debug overlay always on or behind a debug flag

## Technical Cleanup

- [ ] Remove unused legacy fields if no longer needed (`resources.keys`, boss-related remnants)
- [ ] Add lightweight constants comments for tuning parameters
- [ ] Run one final lint/quality sweep before packaging next milestone

## Stretch (If Time)

- [ ] Add a basic generated "next sector" layout variation instead of static maze re-use
- [ ] Add a compact sector summary panel on completion (time survived, nodes destroyed)
