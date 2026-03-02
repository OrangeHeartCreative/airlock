# Survival Horror Shoot ’Em Up — Design Plan

- Define the game pillar as “panic under scarcity”: survival horror tension (low resources, environmental dread, stalking threats) blended with shoot ’em up mastery (movement, crowd control, precision bursts).
- Establish the narrative spine: a prisoner wakes during a bio-ecology containment failure, learns the ship’s terraforming flora fused with alien organisms, and must cross infected decks to reach a final containment or escape decision.
- Lock the playable format to 2D top-down HTML5 for MVP, with keyboard/mouse + gamepad support, emphasizing fast readability, strong audio cues, and oppressive lighting over heavy visual complexity.
- Build a core gameplay loop: enter sector → scavenge oxygen/ammo/biomass keys → survive escalating encounters → complete objective (restore power, purge nest, recover passcode) → extract to a temporary safe room.
- Design pacing in repeating “fear bands”: quiet exploration, warning phase, swarm/stalker attack, short recovery; avoid nonstop combat so dread has time to rebuild.
- Implement survival systems that drive decisions: oxygen timer, contamination meter, tight inventory slots, limited healing, and emergency tools (flare, stun burst) to prevent unwinnable dead ends.
- Create enemy ecology with clear combat roles: creeping vine-traps (area denial), spore drones (ranged pressure), brute bloomers (tank/melee), and adaptive stalkers (psychological threat and ambush behavior).
- Design weapon identity around trade-offs: loud firearms for burst safety, silent cutters/incinerators for stealth control, and bio-reactive ammo that exploits enemy mutation states.
- Structure progression in three layers: short-term room survival, mid-run unlocks (tools/access cards/weapon mods), and between-run meta upgrades that improve consistency without removing horror scarcity.
- Build a vertical-slice-first production plan: movement + shooting feel, one infected deck, 4–6 enemy types, 3 weapons, one boss mutation, 30–45 minute complete run, and two endings.
- Define content expansion after MVP: additional decks with unique biome hazards, new enemy mutations, branching objectives, dynamic event system, and higher-difficulty modifier runs.
- Add atmosphere as a production priority from day one: reactive soundtrack states, positional warning audio, ship PA logs, flicker/blackout events, and diegetic UI for oxygen/contamination stress.
- Plan technical implementation for browser stability: pooled projectiles/enemies, atlas-based sprites, capped particles, fixed update loop, save/checkpoint system via browser storage, and automated performance profiling on target browsers.
- Run balancing and QA with telemetry: track ammo starvation, time-to-death, boss fail points, and abandonment moments; tune spawn cadence and resource placement to preserve fear while rewarding skill.
- Close with release readiness tasks: onboarding/tutorialization for hybrid genre expectations, accessibility options (aim assist, contrast, subtitle intensity cues), bug triage, and a post-launch patch roadmap focused on pacing and difficulty tuning.
