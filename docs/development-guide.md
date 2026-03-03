# Airlock Development Guide

Date: 2026-03-03
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
- Gameplay/menu flows are aligned to gamepad controls.
- Keyboard control surface was removed from active gameplay/menu configuration.

### Core Stability Paths to Protect
- Pause/resume/restart behavior.
- Sector transition loop: `GameScene -> SectorCompleteScene -> GameScene`.
- Death flow: death delay -> `GameOverScene` -> restart to sector 1.

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
- Password-based progression flow removed.
- Weapon progression moved to crate-based random unlocked pickups.
- Pause menu includes main-menu return path.
- Session docs consolidated into this single handbook.
