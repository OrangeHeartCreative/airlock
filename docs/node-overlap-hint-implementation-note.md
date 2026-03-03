# Node-Overlap Hint — Implementation Note (Session 1)

Date: 2026-03-02

## Goal

Reduce confusion when objective nodes and pickups appear close together, without adding UI clutter or changing combat flow.

## Minimal Approach

- Keep the existing objective text in `GameScene.updateObjectiveState()` as the primary guidance.
- Add a contextual, short-lived hint that appears only when the player is near an active objective node and at least one pickup is also nearby.
- Reuse the existing floating text feedback style (`showFloatingPickupText`) for consistency and low implementation risk.

## Proposed Hook Points

- Detection source:
  - Objective nodes are tracked in `this.objectiveNodes` (`buildObjectiveNodes`, `getActiveObjectiveNodeCount`).
  - Pickups are tracked in `this.pickups` (`spawnPickup`, `onPickupCollected`).
- Candidate update loop:
  - Add a lightweight periodic check in `update()` (throttled by timestamp) instead of per-frame expensive scans.
- Candidate trigger logic (MVP):
  - Find nearest active objective node within a small radius of the player.
  - If a pickup is also within a small radius around that node/player cluster, show hint once per cooldown window.

## Hint Behavior (MVP Constraints)

- Text: `Objective node: purple core` (or similarly short copy).
- Duration: brief (same tween lifecycle style as existing floating text).
- Cooldown: prevent spam (for example 3-5 seconds).
- Optionality: gated by a simple config flag to disable quickly if noisy.

## Non-goals

- No new permanent HUD panel.
- No minimap or marker overhaul.
- No gameplay-stat or combat-balance changes.

## Validation Plan (Session 2/3)

- Verify readability in sectors 1-3.
- Smoke test keyboard + at least one gamepad.
- Confirm no regressions in pickup collection and node damage/destruction feedback.
