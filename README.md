# Airlock: The Oncoming Swarm

Top-down survival shooter built with Phaser 3 + Vite.

## Status

**v1.0 — Ship candidate.** Full 12-sector run loop implemented and validated.

- Canonical development guide: `docs/development-guide.md`

## Current MVP Scope

- Start menu with settings/remapping flow
- Gamepad-first controls (preset + custom gamepad remaps)
- Pause menu with resume/restart/main-menu/volume
- Survival combat loop with pickups, enemies, and sector progression
- Gauntlet-like objective flow:
  - Destroy infestation nodes to stop spawns
  - Clear remaining hostiles
  - Extract to advance to next sector screen
- Sector completion scene with carried run state into the next sector
- Dedicated game over scene with restart flow back to sector 1

## Core Gameplay Systems Implemented

- One-stick movement/facing fire model (no two-stick aiming requirement)
- Weapon/resource systems:
  - Shiv Pistol (ammo)
  - Incinerator Carbine (fuel)
  - UV Arc Cutter (heat)
  - Spore Needlegun (precision ammo)
  - Pulse Shotgun (close-range burst)
- Pickup types:
  - Ammo (blue): ammo + fuel
  - Oxygen (cyan): oxygen refill + full contamination clear (no HP effect)
  - Medkit (red cross): health + oxygen + minor contamination relief
  - Weapon Crate (violet): random unlocked weapon swap with on-pickup weapon-name hint
- Survival pressure model:
  - Oxygen drains continuously outside the safe room
  - Contamination (CTM) only begins building once oxygen hits 0
  - Entering the safe room instantly refills oxygen to full and clears CTM over time
  - At max CTM, health drains until the player dies or finds relief
- Floating combat/pickup feedback text for damage and resource gains
- Player/enemy collision against walls and objective nodes
- Enemy spawn safety offset around active nodes to reduce chokepoint jams
- Sector layout/theme variation across all 12 sectors (distinct wall patterns, color mood, and scaling per band)
- Contact recoil window on player hit to create brief post-hit breathing room
- Enlarged HUD + right-side objective checklist panel (nodes, hostiles, extraction)
- Procedural background music system (Web Audio API, no audio files):
  - Atmospheric drone on title and sector-complete screens
  - Full heavy metal soundtrack (drums, distorted power chords, drone) during active gameplay
  - Seamless mode switching across scene transitions; ducks during pause

## Objective/Progression Flow

1. Enter sector
2. Destroy all active objective nodes (shoot to damage/destroy)
3. Clear remaining enemies after nodes are down
4. Reach safe room to extract
5. Transition to `SectorCompleteScene`
6. Continue into next sector with carried state

If HP reaches 0:

1. Gameplay locks and run ends
2. After a short delay, transition to `GameOverScene`
3. Restart returns to sector 1 with fresh resources

## Controls

Default gamepad:

- Move: left stick (with axis fallback)
- Fire: RT/RB
- Interact: A
- Pause: Menu/Start

Menu behavior:

- StartScene selector: `A`
- Start button is not used as selector on StartScene
- Menu navigation in Start/Pause/GameOver uses left stick with deadzone filtering
- Back/cancel in menus uses `B`
- Pause menu includes `Main Menu` to safely exit the current run

Controls can be changed in Settings:

- Control preset selection
- Per-action gamepad remap
- Restore custom binds to defaults

## Project Structure

- `src/main.js` - Phaser bootstrap and scene registration
- `src/scenes/StartScene.js` - Main menu/settings/remap UI
- `src/scenes/GameScene.js` - Core gameplay, spawning, objectives, HUD
- `src/scenes/PauseScene.js` - Pause menu flow
- `src/scenes/SectorCompleteScene.js` - Sector transition/continue flow
- `src/scenes/GameOverScene.js` - Post-death game over + restart flow
- `src/assets/SoundFactory.js` - Procedural SFX synthesis (Web Audio API)
- `src/assets/MusicFactory.js` - Procedural background music engine (Web Audio API)
- `src/assets/TextureFactory.js` - Procedural texture generation
- `src/config/controls.js` - Control presets and remap helpers
- `src/config/debug.js` - Global debug toggle and debug URL flag helpers
- `docs/development-guide.md` - Canonical plan, milestones, QA workflow, and handoff notes

## Run Locally

Requirements:

- Node.js 18+
- npm

Install dependencies:

- `npm install`

Start dev server:

- `npm run dev`

Build for production:

- `npm run build`

Preview production build:

- `npm run preview`

## Notes

- Renderer is forced to `Phaser.CANVAS` for compatibility in embedded/simple-browser test contexts.
- Runtime debug output is hidden by default for player-like playtests.
- Enable debug overlays/readouts only with URL flags (`?debug=1`, or `?debugTuning=1` for tuning readout only).
- Global debug switch lives in `src/config/debug.js` (`DEBUG_TOOLS_ENABLED`) for one-edit enable/disable.
- Control-instruction text is intentionally removed from non-remapping screens.
- **Keyboard input is intentionally disabled** across all scenes. The game is gamepad-only by design.
- **Vite chunk size warning** (Phaser vendor bundle) is a known non-blocker. The `vite.config.js` already splits Phaser into its own `phaser-vendor` chunk; further reduction would require per-module Phaser imports and is deferred post-ship.
- All audio is generated procedurally via the Web Audio API. No audio files are bundled or required.
