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

## Objective/Progression Flow

1. Enter sector
2. Destroy all active objective nodes (shoot to damage/destroy)
3. Clear remaining enemies after nodes are down
4. Reach safe room to extract
5. Transition to `SectorCompleteScene`
6. Continue into next sector with carried state

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
- `src/config/controls.js` - Control presets and remap helpers
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
- A runtime debug overlay is enabled in `main.js` to surface boot/runtime errors quickly during playtests.
