# Airlock Development Guide

Date: 2026-03-04
Status: Canonical development document

## How to Use This Guide

- Start at [1) Product Direction](#1-product-direction) for the design baseline.
- Use [2) Current Gameplay Baseline](#2-current-gameplay-baseline) and [4) Weapon System Baseline](#4-weapon-system-baseline) before making gameplay changes.
- Follow [5) Validation and QA Workflow](#5-validation-and-qa-workflow) for testing and evidence logging.
- Check [6) Packaging and Technical Debt](#6-packaging-and-technical-debt) before touching build/chunking changes.
- End each work block with [7) Operating Rhythm and Handoff](#7-operating-rhythm-and-handoff) and [8) Change Log Notes (Current Snapshot)](#8-change-log-notes-current-snapshot).

## 1) Product Direction

### Core Pillar
- Panic under scarcity: survival-horror tension plus top-down shooter mastery.
- Design priorities: readability, controlled pressure ramps, and reliability under repeated run loops.

### High-Level Loop
- Enter sector.
- Scavenge resources (oxygen/ammo/medkit) while surviving enemy pressure.
- Complete objective-node phase.
- Reach extraction and transition to next sector.

### Scope Bias
- Prioritize gameplay clarity and stability over broad feature expansion.
- Keep UI and systems changes minimal unless directly improving player comprehension or run reliability.

## 2) Current Gameplay Baseline

### Input Model
- Active model is gamepad-first.
- Gameplay/menu flows are aligned to gamepad controls with pointer support where applicable.
- Keyboard input is disabled across all scenes (no movement, confirm, or back actions bound to keys).
- `SectorCompleteScene` progression is gamepad-only:
  - Continue to next sector with gamepad `A`.
  - Main-menu exit option is disabled on this screen to preserve run continuity.
  - On-screen button-instruction hint text is intentionally hidden.
- `StartScene` menu input uses an arm-gate + edge-trigger model:
  - On scene create, input is disarmed. The menu becomes responsive only after all face buttons are fully released.
  - Confirm and back fire on the press edge (down → not-down → down), never on held state.
  - Directional navigation (stick or D-pad) uses a hold-to-scroll debounce once armed.
  - A timeout-based fallback re-arms input after a short window to prevent permanent lockout if a button reports as held/noisy.
  - This prevents phantom confirms when arriving from a scene transition with a button still physically held.
- Scene transitions call `scene.stop()` on the originating scene after launching the target, preventing ghost-scene parallel execution.

### Core Stability Paths to Protect
- Pause/resume/restart behavior.
- Sector transition loop: `GameScene -> SectorCompleteScene -> GameScene`.
- Death flow: death delay -> `GameOverScene` -> restart to sector 1.

### Survival System
- Oxygen drains continuously at 1.8/s outside the safe room and 0.8/s inside.
- Contamination (CTM) only begins building (2.5/s) once oxygen reaches 0. While oxygen remains above 0, CTM does not accumulate.
- Inside the safe room, CTM clears at -6/s regardless of oxygen level.
- Upon entering the safe room, oxygen is instantly restored to full (MAX_OXYGEN).
- At max contamination, health drains at `CTM_OVERDOSE_HP_DRAIN` per second.
- O2 pickups: restore +24 oxygen and fully clear contamination. Do not restore HP.
- Medkit pickups: restore +22 HP, +10 oxygen, and reduce contamination by 10.

### Readability Cue
- Objective/pickup overlap readability is supported by contextual node-overlap hint behavior.
- Hint behavior should stay low-noise and non-intrusive.

## 3) Content Expansion Program

### Milestone Goal
Expand sector depth while keeping readability and stability quality at baseline.

### Target Outcomes
- Minimum target: 9 distinct-feeling sectors.
- Stretch target: 12 sectors when schedule and stability allow.
- Preserve fairness, flow clarity, and progression legibility.

### Sector-Band Model
- Early: sectors 1-3.
- Mid: sectors 4-6.
- Late: sectors 7-9.
- Stretch late+: sectors 10-12.

### Scaling Knobs
- Node objective count/density.
- Node objective durability.
- Enemy pressure envelope.
- Pickup cadence.
- Pickup lifetime.

### Delivery Constraints
- Keep build and quality checks green.
- Log known non-blockers (for example Phaser chunk warning) with rationale.
- Prefer low-risk implementation deltas.

## 4) Weapon System Baseline

### Implemented Loadout Set
- Shiv Pistol: reliable baseline sidearm.
- Incinerator Carbine: short-range crowd/hazard control.
- UV Arc Cutter: anti-mutation sustained-pressure specialist.
- Spore Needlegun: precision anti-stalker option.
- Pulse Shotgun: late-run close-range crowd control.

### Weapon Rollout Rules
- Start weapon: Shiv Pistol.
- Weapon pickups begin at sector 3 and draw from unlocked pool.
- Unlock bands:
  - Sector 3+: Incinerator Carbine
  - Sector 5+: UV Arc Cutter
  - Sector 7+: Spore Needlegun
  - Sector 9+: Pulse Shotgun

### Current Weapon-Pickup Behavior
- Weapon crates randomize from currently unlocked weapons excluding equipped weapon.
- Pickup hint can show the crate outcome (example: `Weapon Crate: UV Arc Cutter`).

### Late-Run Tuning Snapshot
- Spore Needlegun: ammo cost 3, ~210ms cadence, high projectile speed, stalker bonus.
- Pulse Shotgun: ammo cost 6, ~430ms cadence, 5-pellet burst, controlled knockback profile.
- Sector 11-12 micro-scaling adds moderate late-run uplift while preserving resource pressure.
- UV Arc Cutter heat/lockout cadence adjusted for better sustained usability.
- Pickup economy increased to support practical use of crate-driven weapon swaps.

### Future Weapon Backlog Ideas
- Bio-Acid Sprayer.
- Rail Lance (Charged).
- Grav Mine Launcher.
- Pollen Disruptor.
- Emergency Flare Gun.

## 5) Validation and QA Workflow

### Required Commands
- Build verification: `npm run build`.
- Dev run for manual playtests: `npm run dev`.
- Quality analysis: Codacy CLI analyze (run for each edited file).

### Optional Runtime Instrumentation
- QA mode flag: `?qaSession5=1`.
- In-run summary hotkey: `F9`.

### Session Workflow Template
Use the following sequence for milestone execution:

1. Baseline + scope freeze.
2. Layout/content implementation batch A.
3. Layout/content implementation batch B.
4. Progression scaling review.
5. Readability and weapon-feel review.
6. Stability regression under longer-run pressure.
7. Packaging/performance follow-up.
8. Closeout notes and handoff prep.

### Session Checklist Templates

#### Session 2 — Node-Overlap Smoke
- Verify node-overlap hint appears in correct context.
- Verify readability and non-spam timing.
- Verify node/pickup interaction integrity.
- Verify pause/resume reliability.

#### Session 2/3 — Layout + Progression Validation
- Confirm visible layout diversity across sectors 1-12.
- Confirm node placement, safe-room, and spawn viability.
- Confirm progression trends across durability/pressure/pickup pacing.
- Log per-sector navigation/collision observations.

#### Session 3 — UX Validation (Sectors 1-3)
- Validate hint context correctness.
- Validate combat readability and placement clarity.
- Log tuning candidates: copy/size/offset/cooldown.

#### Session 4 — Stability Regression A
- Stress pause/resume/restart.
- Repeat transition loop and check for lockups/freeze/double transitions.
- Record reproducible issues with severity and repro steps.

#### Session 5 — Stability Regression B
- Repeat death->game over->restart checks.
- Re-check StartScene and pause menu input rules.
- Compare behavior across available gamepad profiles.

#### Session 5 — Expanded UX + Weapon Feel (Sectors 8-12)
- Validate objective/pickup/combat readability in late sectors.
- Verify extraction clarity after objective completion.
- Run Sector 10 vs 12 weapon-feel comparison.

### Weapon Feel Quick Comparison (Sector 10 vs 12)
Evaluate the following rows with `OK`, `ISSUE`, or `N/A`:
- Spore Needlegun cadence/precision.
- Spore Needlegun stalker-counter value.
- Pulse Shotgun burst control.
- Pulse Shotgun knockback feel.
- Resource pressure parity.

When `ISSUE` is used, log:
- Sector,
- Severity (P1/P2/P3),
- Problem summary,
- Suggested fix.

## 6) Packaging and Technical Debt

### Current Non-Blocker
- Vite chunk warning remains primarily related to Phaser vendor chunk sizing.

### Policy
- Allow warning as documented non-blocker unless release goals require stricter packaging constraints.
- Keep low-risk chunking options on backlog.

## 7) Operating Rhythm and Handoff

### Working Rhythm
- Keep session-based execution with explicit checklist outcomes.
- Keep per-session evidence concise and reproducible.
- Re-run build and quality sweeps at baseline and packaging checkpoints.

### Next Focus
- Run focused gamepad playtest for navigation/collision reliability across sectors 1-12.
- Review extraction-clarity flow in objective-clear scenarios across late sectors.
- Keep chunk-warning item tracked as deferred non-blocking tech debt.
- Keep this guide synchronized with gameplay/system changes.

## 8) Change Log Notes (Current Snapshot)

- Input model migrated to gamepad-first across active gameplay/menu flows.
- Password-based progression flow available via settings menu (`Sector Password`).
- Weapon progression moved to crate-based random unlocked pickups.
- Pause menu includes main-menu return path.
- QA pass logged: objective/pickup overlap readability validated in sectors 10-12 (non-spam, context-correct behavior).
- Session tag: 2026-03-04 / QA-Overlap-LateSectors.
- QA pass logged: late-game weapon feel validated (Spore Needlegun + Pulse Shotgun in sectors 10-12).
- Session tag: 2026-03-04 / QA-WeaponFeel-LateSectors.
- QA block closeout: no blockers found in this late-sector validation pass.
- Regression pass logged: remap input capture safety verified (no leaked button actions in remap flow).
- Regression pass logged: weapon crate pickup now fully reloads ammo and verified in playtest.
- Regression pass logged: out-of-ammo hint readability and anti-spam cooldown verified.
- Regression pass logged: sectors 5-12 medkit fairness tuning verified (including late-sector drought protection).
- Session tag: 2026-03-04 / QA-Regression-Stability-Balance.
- Session implementation summary (2026-03-04):
  - Restored sector-password flow via settings menu with named + numeric formats.
  - Fixed remap-gamepad input leakage (capture now blocks downstream menu action triggers).
  - Tuned late-sector enemy pressure and pursuit stickiness for fairer sectors 7-12.
  - Increased medkit fairness in sectors 5-12 (weighted chance + drought protection).
  - Updated weapon-crate behavior to fully reload ammo on pickup.
  - Added readable, cooldown-limited `OUT OF AMMO` hint on attempted fire at zero ammo.
  - Added first-run tutorial guidance steps for sector 1 and one-pass completion tracking.
  - Added subtle spore weave movement variation to improve enemy behavior variety.
- Session tag: 2026-03-04 / Impl-Balance-UX-Variety.
- Session docs consolidated into this single handbook.
- Session implementation summary (2026-03-04 — input/scene stability):
  - Fixed Pause → Main Menu full game lockout (root cause: ghost-scene parallel execution loop).
    - `PauseScene.confirmSelection()` now calls `this.scene.stop()` after launching `StartScene`.
    - `StartScene.startGameAtSector()` now calls `this.scene.stop()` after launching `GameScene`.
    - Without these stops, both scenes kept running in parallel, causing `GameScene` to restart every debounce tick (≈160ms) while `StartScene` was still alive.
  - Rewrote `StartScene` menu input model (arm-gate + edge-trigger):
    - Removed: held-state confirm, `confirmInputArmed`, `blockMenuInputUntilRelease`, `forceConfirmArmAt`, `syncConfirmButtonStates()`, `updateConfirmInputArmState()`, `handleBlockedMenuInputRelease()`, `shouldSkipMenuProcessing()`, `processDirectionalMenuInput()`, `processConfirmMenuInput()`.
    - Added: `inputArmed` flag (false on create, set true once all face buttons released), `prevConfirmPressed`/`prevBackPressed` edge trackers.
    - Confirm and back now fire on press edge only; directional hold-scroll debounce unchanged.
  - Build size reduced by ~1.3 kB (dead code removed).
- Session tag: 2026-03-04 / Fix-SceneTransition-InputLock.
- Session implementation summary (2026-03-04 — menu control polish):
  - `SectorCompleteScene` now uses a single confirm button (`A`) for both outcomes.
    - Left stick up/down changes selected option (`CONTINUE` / `MAIN MENU`).
    - `A` confirms the selected option.
    - Pointer click behavior remains supported for both options.
    - Removed on-screen controller instruction line from the sector-complete panel.
  - `StartScene` input arming now includes a short timeout fallback to prevent settings/menu lockout when gamepad button state is noisy.
- Session tag: 2026-03-04 / Fix-SettingsMenu-InputArm-Timeout.
- Session implementation summary (2026-03-04 — pause/start-run stability closeout):
  - Fixed `Pause -> Main -> Start Run` lock path by hardening pause/input handoff state.
    - `PauseScene` now disarms pause-button state (`pauseButtonArmed = false`) before launching `StartScene` from pause menu.
    - `StartScene.startGameAtSector()` now sets a startup pause-input lock and disarms pause before launching `GameScene`.
  - Added control-config guard to prevent pause-button collisions with interact/fire buttons.
    - In `getControlConfig()`, if `pauseButton` conflicts with interact/primary/secondary fire, it falls back to preset pause button.
  - Fixed Phaser animation-frame crash (`Cannot read properties of null (reading 'sourceSize')`) after run restarts.
    - `TextureFactory` now removes stale animation definitions before rebuilding animations after texture regeneration.
- Session tag: 2026-03-04 / Fix-PauseMainStartRun-And-AnimFrames.
- Session implementation summary (2026-03-04 — sector complete flow simplification):
  - Removed `MAIN MENU` option from `SectorCompleteScene`.
  - Sector-complete confirmation is now single-path: gamepad `A` always advances to next sector.
  - Removed option-selection logic tied to stick up/down on the sector-complete screen.
- Session tag: 2026-03-04 / Simplify-SectorComplete-ContinueOnly.
- Session implementation summary (2026-03-04 — survival system rework):
  - CTM now only accumulates after oxygen reaches 0 (previously ran in parallel with oxygen drain).
  - O2 pickups now fully clear contamination on pickup (previously reduced CTM by 18).
  - O2 pickups do not restore HP.
  - Entering the safe room instantly restores oxygen to full (`MAX_OXYGEN`).
- Session tag: 2026-03-04 / Rework-SurvivalSystem-O2-CTM.
