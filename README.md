# Airlock MVP

Top-down survival shooter prototype built with Phaser 3 + Vite.

## Current MVP Scope

- Start menu with settings/remapping flow
- Keyboard + gamepad controls (preset + custom per-action remaps)
- Pause menu with resume/restart/volume
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
- Pickup types:
  - Ammo (blue): ammo + fuel
  - Oxygen (cyan): oxygen + contamination relief
  - Medkit (red cross): health + oxygen + minor contamination relief
- Floating combat/pickup feedback text for damage and resource gains
- Player/enemy collision against walls and objective nodes
- Enemy spawn safety offset around active nodes to reduce chokepoint jams
- Sector layout/theme variation (1-3 rotate distinct wall patterns and color mood)
- Contact recoil window on player hit to create brief post-hit breathing room
- Enlarged HUD + right-side objective checklist panel (nodes, hostiles, extraction)

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

Default keyboard:

- Move: `W A S D` (fallback arrow keys also supported)
- Fire: `Space` (mouse fire is also accepted)
- Interact: `E`
- Pause: `Esc`
- Sprint: `Shift`

Default gamepad:

- Move: left stick (with axis fallback)
- Fire: RT/RB
- Interact: A
- Pause: Menu/Start

Menu behavior:

- StartScene selector: `Enter` (keyboard) or `A` (gamepad)
- Start button is not used as selector on StartScene
- Menu navigation in Start/Pause uses left stick with deadzone filtering

Controls can be changed in Settings:

- Control preset selection
- Per-action keyboard remap
- Per-action gamepad remap
- Device-specific/default restore options

## Project Structure

- `src/main.js` - Phaser bootstrap and scene registration
- `src/scenes/StartScene.js` - Main menu/settings/remap UI
- `src/scenes/GameScene.js` - Core gameplay, spawning, objectives, HUD
- `src/scenes/PauseScene.js` - Pause menu flow
- `src/scenes/SectorCompleteScene.js` - Sector transition/continue flow
- `src/scenes/GameOverScene.js` - Post-death game over + restart flow
- `src/config/controls.js` - Control presets and remap helpers
- `src/config/debug.js` - Global debug toggle and debug URL flag helpers
- `docs/plan-prisoner-starship-bloom.prompt.md` - Original game plan
- `docs/weapon-system-ideas.md` - Weapon ideas/backlog
- `docs/todo-next-session.md` - Next-session handoff checklist

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
