import Phaser from 'phaser';
import { getControlConfig } from '../config/controls.js';
import { DEBUG_TOOLS_ENABLED, isDebugFlagEnabled } from '../config/debug.js';

const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 1400;

// Core player/resource caps.
const MAX_OXYGEN = 100;
const MAX_CONTAMINATION = 100;
const MAX_UV_HEAT = 100;
const DEFAULT_EQUIPPED_WEAPON_ID = 'shivPistol';

// Input and combat pacing.
const GAMEPAD_AXIS_MULTIPLIER_X = 1;
const GAMEPAD_AXIS_MULTIPLIER_Y = -1;
const START_SPAWN_GRACE_MS = 6000;
const EARLY_GAME_WINDOW_MS = 25000;
const EARLY_MIN_SPAWN_DISTANCE = 520;
const NORMAL_MIN_SPAWN_DISTANCE = 300;
const FIRST_WAVE_FORWARD_SPAWNS = 6;
const FORWARD_SPAWN_DOT_THRESHOLD = 0.15;
const PLAYER_HIT_COOLDOWN_MS = 650;
const ENEMY_CONTACT_HIT_COOLDOWN_MS = 1200;
const CONTACT_HIT_DISTANCE_PX = 42;
const PLAYER_RECOIL_DURATION_MS = 320;
const PLAYER_RECOIL_DECAY_PER_FRAME = 0.89;
const PICKUP_CONTACT_GRACE_MS = 320;
const PICKUP_OVERLAP_PROTECTION_RADIUS_PX = 24;
const PICKUP_WALL_PADDING_PX = 20;
const PICKUP_SAFE_ROOM_PADDING_PX = 36;
const NODE_OVERLAP_HINT_ENABLED = true;
const NODE_OVERLAP_HINT_SCAN_INTERVAL_MS = 220;
const NODE_OVERLAP_HINT_NODE_RADIUS_PX = 190;
const NODE_OVERLAP_HINT_PICKUP_RADIUS_PX = 120;
const NODE_OVERLAP_HINT_COOLDOWN_MS = 4200;

// Objective node and enemy pressure scaling.
const OBJECTIVE_NODE_BASE_HEALTH = 130;
const OBJECTIVE_NODE_HEALTH_PER_SECTOR = 12;
const OBJECTIVE_NODE_MAX_HEALTH = 190;
const ENEMY_NODE_SPAWN_CLEARANCE_PX = 165;
const ENEMY_NODE_SPAWN_CLEARANCE_BONUS_PER_SECTOR = 8;
const ENEMY_NODE_SPAWN_CLEARANCE_MAX_PX = 210;

// Pickup and progression timing.
const PICKUP_BASE_LIFETIME_MS = 9000;
const PICKUP_LIFETIME_BONUS_PER_SECTOR_MS = 700;
const PICKUP_MAX_LIFETIME_MS = 13000;
const OBJECTIVE_NODE_WALL_CLEARANCE_PX = 52;
const OBJECTIVE_NODE_START_CLEARANCE_PX = 200;
const OBJECTIVE_NODE_MIN_SPACING_PX = 220;
const OBJECTIVE_NODE_REACHABILITY_CELL_SIZE_PX = 40;
const OBJECTIVE_NODE_REACHABILITY_WALL_PADDING_PX = 14;
const RESUME_CONTACT_GRACE_MS = 450;
const GAME_OVER_DELAY_MS = 2400;
const GAMEPLAY_TUNING_DEBUG_TOGGLE_KEY = 'gameplayTuningDebugEnabled';
const PAUSE_BUTTON_ARMED_KEY = 'pauseButtonArmed';
const STARTING_RESOURCES = {
  ammo: 64,
  fuel: 48,
  uvHeat: 0,
  oxygen: MAX_OXYGEN,
  contamination: 0,
  health: 100
};

const WEAPON_LOADOUT = [
  { id: 'shivPistol', label: 'Shiv Pistol' },
  { id: 'incineratorCarbine', label: 'Incinerator Carbine' },
  { id: 'uvArcCutter', label: 'UV Arc Cutter' },
  { id: 'sporeNeedlegun', label: 'Spore Needlegun' },
  { id: 'pulseShotgun', label: 'Pulse Shotgun' }
];

const WEAPON_UNLOCK_BY_SECTOR = [
  { sector: 1, weaponId: 'shivPistol' },
  { sector: 3, weaponId: 'incineratorCarbine' },
  { sector: 5, weaponId: 'uvArcCutter' },
  { sector: 7, weaponId: 'sporeNeedlegun' },
  { sector: 9, weaponId: 'pulseShotgun' }
];

const WEAPON_PICKUP_BASE_CHANCE = 0.14;

const SECTOR_LAYOUT_DEFINITIONS = [
  {
    backgroundColor: 0x0b120e,
    ambientParticleColor: 0x8ced67,
    wallColor: 0x163124,
    internalWalls: [
      [WORLD_WIDTH * 0.36, WORLD_HEIGHT * 0.24, 420, 22],
      [WORLD_WIDTH * 0.74, WORLD_HEIGHT * 0.24, 360, 22],
      [WORLD_WIDTH * 0.26, WORLD_HEIGHT * 0.5, 320, 22],
      [WORLD_WIDTH * 0.58, WORLD_HEIGHT * 0.5, 300, 22],
      [WORLD_WIDTH * 0.84, WORLD_HEIGHT * 0.5, 250, 22],
      [WORLD_WIDTH * 0.34, WORLD_HEIGHT * 0.76, 380, 22],
      [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.76, 330, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.15, 22, 220],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.47, 22, 200],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.82, 22, 220],
      [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.66, 22, 220],
      [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.34, 22, 220]
    ]
  },
  {
    backgroundColor: 0x0c1119,
    ambientParticleColor: 0x7fc0ff,
    wallColor: 0x1f2f4a,
    internalWalls: [
      [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.3, 260, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.3, 280, 22],
      [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.3, 260, 22],
      [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.68, 260, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.68, 280, 22],
      [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.68, 260, 22],
      [WORLD_WIDTH * 0.32, WORLD_HEIGHT * 0.5, 22, 280],
      [WORLD_WIDTH * 0.68, WORLD_HEIGHT * 0.5, 22, 280],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 220, 22],
      [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.5, 22, 220],
      [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.5, 22, 220]
    ]
  },
  {
    backgroundColor: 0x130d12,
    ambientParticleColor: 0xff9bc2,
    wallColor: 0x46213b,
    internalWalls: [
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.22, 760, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.78, 760, 22],
      [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.5, 22, 520],
      [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.5, 22, 520],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 360, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.38, 22, 180],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.62, 22, 180],
      [WORLD_WIDTH * 0.36, WORLD_HEIGHT * 0.38, 180, 22],
      [WORLD_WIDTH * 0.64, WORLD_HEIGHT * 0.62, 180, 22],
      [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.22, 180, 22],
      [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.78, 180, 22]
    ]
  },
  {
    backgroundColor: 0x0a1315,
    ambientParticleColor: 0x84f0ff,
    wallColor: 0x1d454d,
    internalWalls: [
      [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.2, 22, 280],
      [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.2, 22, 280],
      [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.8, 22, 280],
      [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.8, 22, 280],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.18, 420, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.82, 420, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.42, 640, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.58, 640, 22],
      [WORLD_WIDTH * 0.38, WORLD_HEIGHT * 0.5, 22, 230],
      [WORLD_WIDTH * 0.62, WORLD_HEIGHT * 0.5, 22, 230]
    ]
  },
  {
    backgroundColor: 0x10130b,
    ambientParticleColor: 0xe7ff8e,
    wallColor: 0x3f4f1f,
    internalWalls: [
      [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.34, 240, 22],
      [WORLD_WIDTH * 0.33, WORLD_HEIGHT * 0.34, 260, 22],
      [WORLD_WIDTH * 0.52, WORLD_HEIGHT * 0.34, 260, 22],
      [WORLD_WIDTH * 0.71, WORLD_HEIGHT * 0.34, 260, 22],
      [WORLD_WIDTH * 0.9, WORLD_HEIGHT * 0.34, 240, 22],
      [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.66, 240, 22],
      [WORLD_WIDTH * 0.33, WORLD_HEIGHT * 0.66, 260, 22],
      [WORLD_WIDTH * 0.52, WORLD_HEIGHT * 0.66, 260, 22],
      [WORLD_WIDTH * 0.71, WORLD_HEIGHT * 0.66, 260, 22],
      [WORLD_WIDTH * 0.9, WORLD_HEIGHT * 0.66, 240, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 22, 320]
    ]
  },
  {
    backgroundColor: 0x151010,
    ambientParticleColor: 0xffb181,
    wallColor: 0x5f2e22,
    internalWalls: [
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.2, 22, 240],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 22, 260],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.8, 22, 240],
      [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.18, 260, 22],
      [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.18, 260, 22],
      [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.5, 300, 22],
      [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.5, 300, 22],
      [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.82, 260, 22],
      [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.82, 260, 22],
      [WORLD_WIDTH * 0.12, WORLD_HEIGHT * 0.5, 22, 280],
      [WORLD_WIDTH * 0.88, WORLD_HEIGHT * 0.5, 22, 280]
    ]
  },
  {
    backgroundColor: 0x0f1018,
    ambientParticleColor: 0xc0b1ff,
    wallColor: 0x2e2f5f,
    internalWalls: [
      [WORLD_WIDTH * 0.28, WORLD_HEIGHT * 0.22, 22, 240],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.22, 22, 240],
      [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.22, 22, 240],
      [WORLD_WIDTH * 0.28, WORLD_HEIGHT * 0.78, 22, 240],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.78, 22, 240],
      [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.78, 22, 240],
      [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.5, 240, 22],
      [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.5, 240, 22],
      [WORLD_WIDTH * 0.39, WORLD_HEIGHT * 0.5, 220, 22],
      [WORLD_WIDTH * 0.61, WORLD_HEIGHT * 0.5, 220, 22]
    ]
  },
  {
    backgroundColor: 0x0c1510,
    ambientParticleColor: 0x8effb2,
    wallColor: 0x1f5a36,
    internalWalls: [
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.28, 680, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.72, 680, 22],
      [WORLD_WIDTH * 0.3, WORLD_HEIGHT * 0.5, 22, 500],
      [WORLD_WIDTH * 0.7, WORLD_HEIGHT * 0.5, 22, 500],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 300, 22],
      [WORLD_WIDTH * 0.18, WORLD_HEIGHT * 0.28, 22, 200],
      [WORLD_WIDTH * 0.82, WORLD_HEIGHT * 0.72, 22, 200],
      [WORLD_WIDTH * 0.18, WORLD_HEIGHT * 0.72, 190, 22],
      [WORLD_WIDTH * 0.82, WORLD_HEIGHT * 0.28, 190, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.14, 190, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.86, 190, 22]
    ]
  },
  {
    backgroundColor: 0x171009,
    ambientParticleColor: 0xffd594,
    wallColor: 0x63452a,
    internalWalls: [
      [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.22, 300, 22],
      [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.22, 300, 22],
      [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.78, 300, 22],
      [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.78, 300, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 760, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.34, 500, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.66, 500, 22],
      [WORLD_WIDTH * 0.38, WORLD_HEIGHT * 0.5, 22, 260],
      [WORLD_WIDTH * 0.62, WORLD_HEIGHT * 0.5, 22, 260],
      [WORLD_WIDTH * 0.12, WORLD_HEIGHT * 0.5, 22, 220],
      [WORLD_WIDTH * 0.88, WORLD_HEIGHT * 0.5, 22, 220]
    ]
  },
  {
    backgroundColor: 0x10161b,
    ambientParticleColor: 0x8ed8ff,
    wallColor: 0x284f66,
    internalWalls: [
      [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.18, 22, 240],
      [WORLD_WIDTH * 0.4, WORLD_HEIGHT * 0.18, 22, 240],
      [WORLD_WIDTH * 0.6, WORLD_HEIGHT * 0.18, 22, 240],
      [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.18, 22, 240],
      [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.82, 22, 240],
      [WORLD_WIDTH * 0.4, WORLD_HEIGHT * 0.82, 22, 240],
      [WORLD_WIDTH * 0.6, WORLD_HEIGHT * 0.82, 22, 240],
      [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.82, 22, 240],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.34, 520, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.66, 520, 22]
    ]
  },
  {
    backgroundColor: 0x1a0f17,
    ambientParticleColor: 0xff9fef,
    wallColor: 0x682f59,
    internalWalls: [
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.16, 740, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.84, 740, 22],
      [WORLD_WIDTH * 0.16, WORLD_HEIGHT * 0.5, 22, 540],
      [WORLD_WIDTH * 0.84, WORLD_HEIGHT * 0.5, 22, 540],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 420, 22],
      [WORLD_WIDTH * 0.28, WORLD_HEIGHT * 0.34, 22, 220],
      [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.34, 22, 220],
      [WORLD_WIDTH * 0.28, WORLD_HEIGHT * 0.66, 22, 220],
      [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.66, 22, 220],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.34, 220, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.66, 220, 22]
    ]
  },
  {
    backgroundColor: 0x0d1218,
    ambientParticleColor: 0x98e5ff,
    wallColor: 0x2d5a74,
    internalWalls: [
      [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.22, 240, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.22, 240, 22],
      [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.22, 240, 22],
      [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.78, 240, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.78, 240, 22],
      [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.78, 240, 22],
      [WORLD_WIDTH * 0.34, WORLD_HEIGHT * 0.5, 22, 440],
      [WORLD_WIDTH * 0.66, WORLD_HEIGHT * 0.5, 22, 440],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, 300, 22],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.36, 22, 140],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.64, 22, 140]
    ]
  }
];

const SECTOR_NODE_POSITION_SETS = [
  [
    [340, 260],
    [WORLD_WIDTH - 260, 260],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT - 260],
    [WORLD_WIDTH * 0.18, WORLD_HEIGHT * 0.82],
    [WORLD_WIDTH * 0.82, WORLD_HEIGHT * 0.82],
    [WORLD_WIDTH * 0.25, WORLD_HEIGHT * 0.34],
    [WORLD_WIDTH * 0.74, WORLD_HEIGHT * 0.62]
  ],
  [
    [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.2],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.2],
    [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.2],
    [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.8],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.8],
    [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.8],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5]
  ],
  [
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.28],
    [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.28],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.72],
    [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.72],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.86]
  ],
  [
    [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.14],
    [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.14],
    [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.86],
    [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.86],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5]
  ],
  [
    [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.36, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.64, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.78],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.78],
    [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.78]
  ],
  [
    [WORLD_WIDTH * 0.16, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.84, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.16, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.84, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.16, WORLD_HEIGHT * 0.84],
    [WORLD_WIDTH * 0.84, WORLD_HEIGHT * 0.84]
  ],
  [
    [WORLD_WIDTH * 0.28, WORLD_HEIGHT * 0.14],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.14],
    [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.14],
    [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.28, WORLD_HEIGHT * 0.86],
    [WORLD_WIDTH * 0.72, WORLD_HEIGHT * 0.86]
  ],
  [
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.12],
    [WORLD_WIDTH * 0.18, WORLD_HEIGHT * 0.3],
    [WORLD_WIDTH * 0.82, WORLD_HEIGHT * 0.3],
    [WORLD_WIDTH * 0.32, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.68, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.18, WORLD_HEIGHT * 0.7],
    [WORLD_WIDTH * 0.82, WORLD_HEIGHT * 0.7]
  ],
  [
    [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.22],
    [WORLD_WIDTH * 0.34, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.66, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.78],
    [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.78]
  ],
  [
    [WORLD_WIDTH * 0.12, WORLD_HEIGHT * 0.24],
    [WORLD_WIDTH * 0.38, WORLD_HEIGHT * 0.24],
    [WORLD_WIDTH * 0.62, WORLD_HEIGHT * 0.24],
    [WORLD_WIDTH * 0.88, WORLD_HEIGHT * 0.24],
    [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.76],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.76],
    [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.76]
  ],
  [
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.1],
    [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.3],
    [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.3],
    [WORLD_WIDTH * 0.34, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.66, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.7],
    [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.7]
  ],
  [
    [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.16],
    [WORLD_WIDTH * 0.16, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.84, WORLD_HEIGHT * 0.5],
    [WORLD_WIDTH * 0.24, WORLD_HEIGHT * 0.84],
    [WORLD_WIDTH * 0.76, WORLD_HEIGHT * 0.84]
  ]
];

const GLOBAL_NODE_FALLBACK_POSITIONS = [
  [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.2],
  [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.2],
  [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.2],
  [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.5],
  [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5],
  [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.5],
  [WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.8],
  [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.8],
  [WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.8],
  [WORLD_WIDTH * 0.34, WORLD_HEIGHT * 0.28],
  [WORLD_WIDTH * 0.66, WORLD_HEIGHT * 0.28],
  [WORLD_WIDTH * 0.34, WORLD_HEIGHT * 0.72],
  [WORLD_WIDTH * 0.66, WORLD_HEIGHT * 0.72],
  [WORLD_WIDTH * 0.12, WORLD_HEIGHT * 0.5],
  [WORLD_WIDTH * 0.88, WORLD_HEIGHT * 0.5],
  [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.12],
  [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.88],
  [WORLD_WIDTH * 0.12, WORLD_HEIGHT * 0.18],
  [WORLD_WIDTH * 0.88, WORLD_HEIGHT * 0.18],
  [WORLD_WIDTH * 0.12, WORLD_HEIGHT * 0.82],
  [WORLD_WIDTH * 0.88, WORLD_HEIGHT * 0.82],
  [WORLD_WIDTH * 0.42, WORLD_HEIGHT * 0.36],
  [WORLD_WIDTH * 0.58, WORLD_HEIGHT * 0.36],
  [WORLD_WIDTH * 0.42, WORLD_HEIGHT * 0.64],
  [WORLD_WIDTH * 0.58, WORLD_HEIGHT * 0.64],
  [WORLD_WIDTH * 0.26, WORLD_HEIGHT * 0.36],
  [WORLD_WIDTH * 0.74, WORLD_HEIGHT * 0.36],
  [WORLD_WIDTH * 0.26, WORLD_HEIGHT * 0.64],
  [WORLD_WIDTH * 0.74, WORLD_HEIGHT * 0.64]
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.projectiles = null;
    this.enemies = null;
    this.pickups = null;
    this.facingDirection = new Phaser.Math.Vector2(1, 0);
    this.nextFireAt = 0;
    this.nextEnemySpawnAt = 0;
    this.nextResourceSpawnAt = 0;
    this.waveLevel = 1;
    this.spawnedEnemyCount = 0;
    this.equippedWeaponId = DEFAULT_EQUIPPED_WEAPON_ID;
    this.uvOverheatUntil = 0;
    this.lastPlayerHitAt = 0;
    this.pickupContactGraceUntil = 0;
    this.playerRecoilUntil = 0;
    this.playerRecoilVelocity = new Phaser.Math.Vector2(0, 0);
    this.previousGamepadButtonState = {};
    this.resources = { ...STARTING_RESOURCES };
    this.objective = {
      stage: 'destroyNodes',
      progress: 0,
      required: 3,
      nodesRemaining: 3,
      text: ''
    };
    this.state = 'playing';
    this.sectorIndex = 1;
    this.hasQueuedSectorTransition = false;
    this.safeRoom = null;
    this.hud = {};
    this.controls = null;
    this.gameplayTuningDebugEnabled = false;
    this.hasQueuedGameOverTransition = false;
    this.nextNodeOverlapHintAt = 0;
    this.nextNodeOverlapHintCheckAt = 0;
    this.reachableNodeGridCache = null;
  }

  create(data = {}) {
    const requestedSectorIndex = Number(data?.sectorIndex);
    const registrySectorIndex = Number(this.registry.get('sectorIndex'));
    const fallbackSectorIndex = Number.isFinite(registrySectorIndex) && registrySectorIndex > 0 ? registrySectorIndex : 1;
    this.sectorIndex = Number.isFinite(requestedSectorIndex) && requestedSectorIndex > 0 ? requestedSectorIndex : fallbackSectorIndex;
    this.registry.set('sectorIndex', this.sectorIndex);

    this.resetRunState({
      carryResources: data?.carryResources === true,
      carriedResources: data?.carriedResources ?? null,
      carriedWeaponId: data?.carriedWeaponId ?? null,
      carriedWaveLevel: data?.carriedWaveLevel ?? null
    });

    this.buildTextures();
    this.buildWorld();
    this.buildPlayer();
    this.buildGroups();
    this.buildObjectiveNodes();
    this.buildSafeRoom();
    this.buildInput();
    this.buildHud();
    this.configureCollisions();

    if (data?.extractionTest === true) {
      this.enableExtractionClarityTestMode();
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.events.on('shutdown', () => {
      if (this.input.gamepad) {
        this.input.gamepad.off('connected', this.onGamepadConnected, this);
      }
    });
    this.events.on('resume', this.onResumeFromPause, this);

    this.runStartedAt = this.time.now;
    this.nextEnemySpawnAt = this.time.now + START_SPAWN_GRACE_MS;
    this.nextResourceSpawnAt = this.time.now + 1200;
    this.gameplayTuningDebugEnabled = this.resolveGameplayTuningDebugEnabled();
    this.nextNodeOverlapHintAt = this.time.now + 1200;
    this.nextNodeOverlapHintCheckAt = this.time.now;

    if (this.registry.get(PAUSE_BUTTON_ARMED_KEY) === undefined) {
      this.registry.set(PAUSE_BUTTON_ARMED_KEY, true);
    }

    this.updateObjectiveText();
  }

  enableExtractionClarityTestMode() {
    this.objectiveNodes.getChildren().forEach((node) => {
      node.setData('active', false);
      node.setTint(0x4ff0a8);
      node.setAlpha(0.55);
    });

    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);

    this.objective.progress = this.objective.required;
    this.objective.nodesRemaining = 0;
    this.objective.stage = 'extract';
    this.showFloatingPickupText('Extraction Test Mode', '#d8ccff', this.player.x, this.player.y - 38, 1100);
  }

  resetRunState({ carryResources = false, carriedResources = null, carriedWeaponId = null, carriedWaveLevel = null } = {}) {
    this.facingDirection.set(1, 0);
    this.nextFireAt = 0;
    this.nextEnemySpawnAt = 0;
    this.nextResourceSpawnAt = 0;
    const sectorWaveBase = 1 + (this.sectorIndex - 1) * 0.35;
    this.waveLevel = Number.isFinite(carriedWaveLevel) ? carriedWaveLevel : sectorWaveBase;
    this.spawnedEnemyCount = 0;
    this.equippedWeaponId = this.resolveEquippedWeaponId(carriedWeaponId);
    this.uvOverheatUntil = 0;
    this.lastPlayerHitAt = 0;
    this.pickupContactGraceUntil = 0;
    this.playerRecoilUntil = 0;
    this.playerRecoilVelocity.set(0, 0);
    this.previousGamepadButtonState = {};
    this.resources = { ...STARTING_RESOURCES };
    if (carryResources && carriedResources) {
      this.resources.ammo = Phaser.Math.Clamp(Number(carriedResources.ammo) || this.resources.ammo, 0, 180);
      this.resources.fuel = Phaser.Math.Clamp(Number(carriedResources.fuel) || this.resources.fuel, 0, 120);
      this.resources.uvHeat = Phaser.Math.Clamp(Number(carriedResources.uvHeat) || 0, 0, MAX_UV_HEAT);
      this.resources.oxygen = Phaser.Math.Clamp(Number(carriedResources.oxygen) || this.resources.oxygen, 12, MAX_OXYGEN);
      this.resources.contamination = Phaser.Math.Clamp(Number(carriedResources.contamination) || 0, 0, MAX_CONTAMINATION);
      this.resources.health = Phaser.Math.Clamp(Number(carriedResources.health) || this.resources.health, 20, 100);
    }
    this.objective = {
      stage: 'destroyNodes',
      progress: 0,
      required: 3,
      nodesRemaining: 3,
      text: ''
    };
    this.state = 'playing';
    this.hasQueuedSectorTransition = false;
    this.hasQueuedGameOverTransition = false;
  }

  resolveEquippedWeaponId(carriedWeaponId) {
    if (!this.isWeaponInLoadout(carriedWeaponId)) {
      return DEFAULT_EQUIPPED_WEAPON_ID;
    }

    return carriedWeaponId;
  }

  getWeaponUnlockSector(weaponId) {
    const unlockEntry = WEAPON_UNLOCK_BY_SECTOR.find((entry) => entry.weaponId === weaponId);
    return unlockEntry?.sector ?? 1;
  }

  isWeaponInLoadout(weaponId) {
    if (typeof weaponId !== 'string') {
      return false;
    }

    return WEAPON_LOADOUT.some((weapon) => weapon.id === weaponId);
  }

  buildTextures() {
    const graphics = this.add.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0xa7f95d, 1);
    graphics.fillRect(0, 0, 24, 24);
    graphics.generateTexture('player', 24, 24);

    graphics.clear();
    graphics.fillStyle(0xffc466, 1);
    graphics.fillCircle(6, 6, 6);
    graphics.generateTexture('bullet', 12, 12);

    graphics.clear();
    graphics.fillStyle(0x74d06e, 1);
    graphics.fillEllipse(14, 10, 28, 20);
    graphics.generateTexture('spore', 28, 20);

    graphics.clear();
    graphics.fillStyle(0x4ea14f, 1);
    graphics.fillRoundedRect(0, 0, 34, 34, 8);
    graphics.generateTexture('brute', 34, 34);

    graphics.clear();
    graphics.fillStyle(0xb7ff87, 1);
    graphics.fillTriangle(0, 20, 20, 0, 40, 20);
    graphics.generateTexture('stalker', 40, 20);

    graphics.clear();
    graphics.fillStyle(0x7d6dff, 1);
    graphics.fillRect(0, 0, 22, 22);
    graphics.fillStyle(0xc8c2ff, 1);
    graphics.fillRect(8, 3, 6, 16);
    graphics.fillRect(3, 8, 16, 6);
    graphics.generateTexture('node', 22, 22);

    graphics.clear();
    graphics.fillStyle(0x71a2ff, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('ammo', 16, 16);

    graphics.clear();
    graphics.fillStyle(0x8af7ff, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('oxygen', 16, 16);

    graphics.clear();
    graphics.fillStyle(0xd83b4c, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.fillStyle(0xfff1f3, 1);
    graphics.fillRect(6, 3, 4, 10);
    graphics.fillRect(3, 6, 10, 4);
    graphics.generateTexture('medkit', 16, 16);

    graphics.clear();
    graphics.fillStyle(0xcab6ff, 1);
    graphics.fillRoundedRect(0, 0, 18, 18, 5);
    graphics.fillStyle(0x433273, 1);
    graphics.fillRect(5, 4, 8, 10);
    graphics.generateTexture('weaponPickup', 18, 18);

    graphics.clear();
    graphics.fillStyle(0xff5b8f, 1);
    graphics.fillCircle(24, 24, 24);
    graphics.destroy();
  }

  buildWorld() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const layout = this.getSectorLayoutDefinition();

    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, layout.backgroundColor);

    for (let index = 0; index < 120; index += 1) {
      const x = Phaser.Math.Between(20, WORLD_WIDTH - 20);
      const y = Phaser.Math.Between(20, WORLD_HEIGHT - 20);
      const alpha = Phaser.Math.FloatBetween(0.08, 0.24);
      this.add.rectangle(x, y, Phaser.Math.Between(2, 6), Phaser.Math.Between(2, 6), layout.ambientParticleColor, alpha);
    }

    const perimeterWalls = [
      [WORLD_WIDTH / 2, 20, WORLD_WIDTH, 40],
      [WORLD_WIDTH / 2, WORLD_HEIGHT - 20, WORLD_WIDTH, 40],
      [20, WORLD_HEIGHT / 2, 40, WORLD_HEIGHT],
      [WORLD_WIDTH - 20, WORLD_HEIGHT / 2, 40, WORLD_HEIGHT]
    ];
    const walls = [...perimeterWalls, ...layout.internalWalls];

    this.walls = this.physics.add.staticGroup();
    walls.forEach(([x, y, width, height]) => {
      const wall = this.add.rectangle(x, y, width, height, layout.wallColor);
      this.physics.add.existing(wall, true);
      this.walls.add(wall);
    });

    this.reachableNodeGridCache = null;
  }

  getSectorLayoutDefinition() {
    return SECTOR_LAYOUT_DEFINITIONS[this.getSectorTemplateIndex()];
  }

  getSectorTemplateIndex() {
    const totalLayouts = SECTOR_LAYOUT_DEFINITIONS.length;
    return ((Math.max(1, this.sectorIndex) - 1) % totalLayouts + totalLayouts) % totalLayouts;
  }

  getSectorProgressScalar() {
    const templateIndex = this.getSectorTemplateIndex();
    const maxIndex = Math.max(1, SECTOR_LAYOUT_DEFINITIONS.length - 1);
    return templateIndex / maxIndex;
  }

  getSectorBandIndex() {
    return Math.floor(this.getSectorTemplateIndex() / 3);
  }

  buildPlayer() {
    this.player = this.physics.add.sprite(120, 120, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(true);
    this.player.setDrag(0.003);
    this.player.setMaxVelocity(220, 220);
  }

  buildGroups() {
    this.projectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 80,
      runChildUpdate: false
    });

    this.enemies = this.physics.add.group();
    this.pickups = this.physics.add.group();
  }

  buildObjectiveNodes() {
    this.objectiveNodes = this.physics.add.staticGroup();
    const preferredNodePositions = this.getPreferredNodePositionsForSector();

    const requiredNodes = this.getRequiredNodeCount();
    const nodePositions = this.getValidObjectiveNodePositions(preferredNodePositions, requiredNodes);

    const nodeHealth = this.getObjectiveNodeHealth();
    nodePositions.forEach(([x, y]) => {
      const node = this.objectiveNodes.create(x, y, 'node');
      node.setData('active', true);
      node.setData('health', nodeHealth);
      node.setTint(0x8d78ff);
    });

    const nodeCount = nodePositions.length;
    this.objective.required = nodeCount;
    this.objective.progress = 0;
    this.objective.nodesRemaining = nodeCount;
    this.objective.stage = 'destroyNodes';
  }

  getPreferredNodePositionsForSector() {
    const sectorCandidates = SECTOR_NODE_POSITION_SETS[this.getSectorTemplateIndex()] || SECTOR_NODE_POSITION_SETS[0];
    const fallbackCandidates = this.getRotatedFallbackNodeCandidates();

    return [...sectorCandidates, ...fallbackCandidates];
  }

  getRotatedFallbackNodeCandidates() {
    const rotation = this.getSectorTemplateIndex() % GLOBAL_NODE_FALLBACK_POSITIONS.length;
    const ordered = [
      ...GLOBAL_NODE_FALLBACK_POSITIONS.slice(rotation),
      ...GLOBAL_NODE_FALLBACK_POSITIONS.slice(0, rotation)
    ];
    const seen = new Set();

    return ordered.filter(([x, y]) => {
      const key = `${Math.round(x)}:${Math.round(y)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getRequiredNodeCount() {
    const templateIndex = this.getSectorTemplateIndex();
    return Phaser.Math.Clamp(3 + Math.floor(templateIndex / 2), 3, 7);
  }

  getObjectiveNodeHealth() {
    const templateIndex = this.getSectorTemplateIndex();
    const scaledHealth = OBJECTIVE_NODE_BASE_HEALTH + templateIndex * OBJECTIVE_NODE_HEALTH_PER_SECTOR;
    return Phaser.Math.Clamp(scaledHealth, OBJECTIVE_NODE_BASE_HEALTH, OBJECTIVE_NODE_MAX_HEALTH + 72);
  }

  getValidObjectiveNodePositions(preferredPositions, requiredCount) {
    const validPositions = [];

    preferredPositions.forEach(([x, y]) => {
      if (validPositions.length >= requiredCount) {
        return;
      }

      if (this.isPositionBlockedByWall(x, y, OBJECTIVE_NODE_WALL_CLEARANCE_PX)) {
        return;
      }

      const tooCloseToPlayerStart = Phaser.Math.Distance.Between(x, y, 120, 120) < OBJECTIVE_NODE_START_CLEARANCE_PX;
      if (tooCloseToPlayerStart) {
        return;
      }

      if (this.isPositionTooCloseToExistingNodes(x, y, validPositions, OBJECTIVE_NODE_MIN_SPACING_PX)) {
        return;
      }

      if (!this.isPositionReachableFromStart(x, y)) {
        return;
      }

      validPositions.push([x, y]);
    });

    let attempts = 0;
    while (validPositions.length < requiredCount && attempts < 80) {
      const randomX = Phaser.Math.Between(120, WORLD_WIDTH - 120);
      const randomY = Phaser.Math.Between(120, WORLD_HEIGHT - 120);
      const blocked = this.isPositionBlockedByWall(randomX, randomY, OBJECTIVE_NODE_WALL_CLEARANCE_PX);
      const closeToStart = Phaser.Math.Distance.Between(randomX, randomY, 120, 120) < OBJECTIVE_NODE_START_CLEARANCE_PX;
      const tooCloseToOtherNodes = this.isPositionTooCloseToExistingNodes(
        randomX,
        randomY,
        validPositions,
        OBJECTIVE_NODE_MIN_SPACING_PX
      );
      const reachableFromStart = this.isPositionReachableFromStart(randomX, randomY);

      if (!blocked && !closeToStart && !tooCloseToOtherNodes && reachableFromStart) {
        validPositions.push([randomX, randomY]);
      }

      attempts += 1;
    }

    return validPositions.slice(0, requiredCount);
  }

  isPositionTooCloseToExistingNodes(x, y, existingPositions, minimumSpacing) {
    return existingPositions.some(([existingX, existingY]) => {
      return Phaser.Math.Distance.Between(x, y, existingX, existingY) < minimumSpacing;
    });
  }

  isPositionBlockedByWall(x, y, padding = 0) {
    return this.walls.getChildren().some((wall) => {
      const bounds = wall.getBounds();
      const expandedBounds = new Phaser.Geom.Rectangle(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2
      );

      return expandedBounds.contains(x, y);
    });
  }

  isPositionReachableFromStart(x, y) {
    if (!this.reachableNodeGridCache) {
      this.reachableNodeGridCache = this.buildReachableNodeGridCache();
    }

    const cache = this.reachableNodeGridCache;
    if (!cache || !cache.reachableCellKeys) {
      return true;
    }

    const clampedX = Phaser.Math.Clamp(x, 0, WORLD_WIDTH - 1);
    const clampedY = Phaser.Math.Clamp(y, 0, WORLD_HEIGHT - 1);
    const col = Phaser.Math.Clamp(Math.floor(clampedX / cache.cellSize), 0, cache.maxCol);
    const row = Phaser.Math.Clamp(Math.floor(clampedY / cache.cellSize), 0, cache.maxRow);

    return cache.reachableCellKeys.has(`${col},${row}`);
  }

  buildReachableNodeGridCache() {
    const cellSize = OBJECTIVE_NODE_REACHABILITY_CELL_SIZE_PX;
    const maxCol = Math.floor((WORLD_WIDTH - 1) / cellSize);
    const maxRow = Math.floor((WORLD_HEIGHT - 1) / cellSize);
    const blockedCellKeys = new Set();

    for (let col = 0; col <= maxCol; col += 1) {
      for (let row = 0; row <= maxRow; row += 1) {
        const sampleX = Phaser.Math.Clamp(col * cellSize + cellSize * 0.5, 0, WORLD_WIDTH - 1);
        const sampleY = Phaser.Math.Clamp(row * cellSize + cellSize * 0.5, 0, WORLD_HEIGHT - 1);

        if (this.isPositionBlockedByWall(sampleX, sampleY, OBJECTIVE_NODE_REACHABILITY_WALL_PADDING_PX)) {
          blockedCellKeys.add(`${col},${row}`);
        }
      }
    }

    const startCol = Phaser.Math.Clamp(Math.floor(120 / cellSize), 0, maxCol);
    const startRow = Phaser.Math.Clamp(Math.floor(120 / cellSize), 0, maxRow);
    const startKey = `${startCol},${startRow}`;

    if (blockedCellKeys.has(startKey)) {
      return null;
    }

    const reachableCellKeys = new Set([startKey]);
    const queue = [[startCol, startRow]];

    while (queue.length > 0) {
      const [currentCol, currentRow] = queue.shift();
      const neighbors = [
        [currentCol - 1, currentRow],
        [currentCol + 1, currentRow],
        [currentCol, currentRow - 1],
        [currentCol, currentRow + 1]
      ];

      neighbors.forEach(([nextCol, nextRow]) => {
        if (nextCol < 0 || nextCol > maxCol || nextRow < 0 || nextRow > maxRow) {
          return;
        }

        const neighborKey = `${nextCol},${nextRow}`;
        if (blockedCellKeys.has(neighborKey) || reachableCellKeys.has(neighborKey)) {
          return;
        }

        reachableCellKeys.add(neighborKey);
        queue.push([nextCol, nextRow]);
      });
    }

    return {
      cellSize,
      maxCol,
      maxRow,
      reachableCellKeys
    };
  }

  buildSafeRoom() {
    this.safeRoom = this.add.rectangle(WORLD_WIDTH - 170, WORLD_HEIGHT - 170, 120, 120, 0x234f35, 0.35);
    this.physics.add.existing(this.safeRoom, true);
  }

  buildInput() {
    this.controls = getControlConfig(this.registry);
    if (this.input.gamepad) {
      this.input.gamepad.once('connected', this.onGamepadConnected, this);
      if (this.input.gamepad.total > 0) {
        this.onGamepadConnected(this.input.gamepad.getPad(0));
      }
    }
  }

  onGamepadConnected(pad) {
    this.pad = pad;
  }

  isPauseRequested() {
    const pauseInputLockUntil = this.registry.get('pauseInputLockUntil') ?? 0;
    const pauseButton = this.controls.gamepad.pauseButton;

    if (this.time.now < pauseInputLockUntil) {
      this.syncGamepadButtonState(pauseButton);
      return false;
    }

    const gamepadPause = this.canConsumePauseButtonPress(pauseButton);

    return gamepadPause;
  }

  canConsumePauseButtonPress(buttonIndex) {
    const isPressed = this.isGamepadButtonPressed(buttonIndex);
    const isArmed = this.registry.get(PAUSE_BUTTON_ARMED_KEY) !== false;

    if (!isPressed) {
      this.registry.set(PAUSE_BUTTON_ARMED_KEY, true);
      this.syncGamepadButtonState(buttonIndex);
      return false;
    }

    if (!isArmed) {
      this.syncGamepadButtonState(buttonIndex);
      return false;
    }

    const justPressed = this.isGamepadButtonJustPressed(buttonIndex);
    if (!justPressed) {
      return false;
    }

    this.registry.set(PAUSE_BUTTON_ARMED_KEY, false);
    return true;
  }

  isGamepadButtonPressed(buttonIndex) {
    if (!this.pad || typeof buttonIndex !== 'number' || this.pad.buttons.length <= buttonIndex) {
      return false;
    }

    return this.pad.buttons[buttonIndex].pressed;
  }

  isGamepadButtonJustPressed(buttonIndex) {
    const pressedNow = this.isGamepadButtonPressed(buttonIndex);
    const wasPressed = this.previousGamepadButtonState[buttonIndex] === true;
    this.previousGamepadButtonState[buttonIndex] = pressedNow;
    return pressedNow && !wasPressed;
  }

  syncGamepadButtonState(buttonIndex) {
    this.previousGamepadButtonState[buttonIndex] = this.isGamepadButtonPressed(buttonIndex);
  }

  buildHud() {
    this.sound.volume = this.registry.get('sfxVolume') ?? 0.7;

    const style = { fontFamily: 'Arial', fontSize: '24px', color: '#ddf8d4' };
    this.hud.resources = this.add.text(16, 16, '', style).setScrollFactor(0).setDepth(10).setLineSpacing(4);
    this.hud.objectives = this.add
      .text(this.scale.width - 16, 16, '', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ddf8d4',
        align: 'right'
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setLineSpacing(4);
  }

  configureCollisions() {
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.objectiveNodes);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.objectiveNodes);
    this.physics.add.collider(this.enemies, this.enemies);

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitEnemy, null, this);
    this.physics.add.overlap(this.projectiles, this.objectiveNodes, this.onProjectileHitNode, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickupCollected, null, this);
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.state !== 'playing') {
      return;
    }

    if (this.isPauseRequested()) {
      if (this.scene.isActive('PauseScene')) {
        return;
      }
      this.scene.launch('PauseScene');
      this.scene.pause();
      return;
    }

    this.handleMovement();
    const fireInputActive = this.handleAimingAndShooting(time);
    this.updateWeaponSystems(dt, time, fireInputActive);
    this.updateSurvival(dt);
    this.updateEnemies(time);
    this.updateObjectiveState();
    this.updateNodeOverlapHint(time);
    this.updateHud();
  }

  getCurrentWeapon() {
    const weapon = WEAPON_LOADOUT.find((loadoutWeapon) => loadoutWeapon.id === this.equippedWeaponId);
    return weapon || WEAPON_LOADOUT[0];
  }

  resolveGameplayTuningDebugEnabled() {
    if (!DEBUG_TOOLS_ENABLED) {
      this.registry.set(GAMEPLAY_TUNING_DEBUG_TOGGLE_KEY, false);
      return false;
    }

    const registryValue = this.registry.get(GAMEPLAY_TUNING_DEBUG_TOGGLE_KEY);
    if (typeof registryValue === 'boolean') {
      return registryValue;
    }

    const enabledFromUrl = isDebugFlagEnabled('debug') || isDebugFlagEnabled('debugTuning');
    this.registry.set(GAMEPLAY_TUNING_DEBUG_TOGGLE_KEY, enabledFromUrl);
    return enabledFromUrl;
  }

  handleMovement() {
    if (this.time.now < this.playerRecoilUntil) {
      this.player.setVelocity(this.playerRecoilVelocity.x, this.playerRecoilVelocity.y);
      this.playerRecoilVelocity.scale(PLAYER_RECOIL_DECAY_PER_FRAME);
      return;
    }

    const speed = 200;
    const movementVector = this.getGamepadMovementVector();

    if (movementVector.lengthSq() > 0) {
      this.facingDirection.copy(movementVector).normalize();
      this.player.rotation = this.facingDirection.angle();
    }

    movementVector.normalize().scale(speed);
    this.player.setVelocity(movementVector.x, movementVector.y);
  }

  getGamepadMovementVector() {
    const axisX = this.getPrimaryGamepadAxisValue([0, 2]);
    const axisY = this.getPrimaryGamepadAxisValue([1, 3]);
    const movementVector = new Phaser.Math.Vector2(0, 0);

    if (Math.abs(axisX) > 0.15) {
      movementVector.x = axisX * GAMEPAD_AXIS_MULTIPLIER_X;
    }
    if (Math.abs(axisY) > 0.15) {
      movementVector.y = axisY * GAMEPAD_AXIS_MULTIPLIER_Y;
    }

    return movementVector;
  }

  getPrimaryGamepadAxisValue(axisCandidates) {
    let selectedAxisValue = 0;

    axisCandidates.forEach((axisIndex) => {
      const axisValue = this.getGamepadAxisValue(axisIndex);
      if (Math.abs(axisValue) > Math.abs(selectedAxisValue)) {
        selectedAxisValue = axisValue;
      }
    });

    return selectedAxisValue;
  }

  getGamepadAxisValue(axisIndex) {
    const phaserPadAxisValue = this.getAxisValueFromSource(this.pad, axisIndex);
    if (Math.abs(phaserPadAxisValue) > 0.0001) {
      return phaserPadAxisValue;
    }

    const browserPad = this.getBrowserConnectedGamepad();
    return this.getAxisValueFromSource(browserPad, axisIndex);
  }

  getAxisValueFromSource(sourcePad, axisIndex) {
    if (!sourcePad || !sourcePad.axes || sourcePad.axes.length <= axisIndex) {
      return 0;
    }

    const axis = sourcePad.axes[axisIndex];
    if (typeof axis === 'number') {
      return axis;
    }
    if (axis && typeof axis.getValue === 'function') {
      return axis.getValue();
    }

    return 0;
  }

  getBrowserConnectedGamepad() {
    const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
    if (!browserNavigator || !browserNavigator.getGamepads) {
      return null;
    }

    const pads = browserNavigator.getGamepads();
    for (let index = 0; index < pads.length; index += 1) {
      if (pads[index]) {
        return pads[index];
      }
    }

    return null;
  }

  handleAimingAndShooting(time) {
    const pointer = this.input.activePointer;

    const fireInputActive = this.isFireInputActive(pointer);
    if (fireInputActive) {
      this.fireCurrentWeapon(time, this.facingDirection);
    }

    return fireInputActive;
  }

  isFireInputActive(pointer) {
    const mouseFire = pointer.isDown;
    const fireButtons = this.controls.gamepad.fireButtons;
    const gamepadFire = fireButtons.some((buttonIndex) => this.isGamepadButtonPressed(buttonIndex));

    return mouseFire || gamepadFire;
  }

  fireCurrentWeapon(time, direction) {
    if (direction.lengthSq() === 0) {
      return;
    }

    const weapon = this.getCurrentWeapon();
    if (weapon.id === 'shivPistol') {
      this.fireShivPistol(time, direction);
      return;
    }

    if (weapon.id === 'incineratorCarbine') {
      this.fireIncineratorCarbine(time, direction);
      return;
    }

    if (weapon.id === 'uvArcCutter') {
      this.fireUvArcCutter(time, direction);
      return;
    }

    if (weapon.id === 'sporeNeedlegun') {
      this.fireSporeNeedlegun(time, direction);
      return;
    }

    if (weapon.id === 'pulseShotgun') {
      this.firePulseShotgun(time, direction);
      return;
    }

    this.fireShivPistol(time, direction);
  }

  fireShivPistol(time, direction) {
    if (time < this.nextFireAt || this.resources.ammo <= 0) {
      return;
    }

    this.resources.ammo -= 1;
    this.nextFireAt = time + 140;
    this.spawnProjectile({
      direction,
      speed: 520,
      damage: 26,
      lifetime: 1100,
      scale: 1,
      tint: 0xffc466,
      weaponType: 'shivPistol'
    });
  }

  fireIncineratorCarbine(time, direction) {
    if (time < this.nextFireAt || this.resources.fuel <= 0) {
      return;
    }

    this.resources.fuel = Math.max(0, this.resources.fuel - 1);
    this.nextFireAt = time + 88;

    const spread = Phaser.Math.FloatBetween(-0.17, 0.17);
    const incineratorDirection = direction.clone().rotate(spread);

    this.spawnProjectile({
      direction: incineratorDirection,
      speed: 360,
      damage: 18,
      lifetime: 460,
      scale: 1.25,
      tint: 0xff7c4a,
      weaponType: 'incineratorCarbine'
    });
  }

  fireUvArcCutter(time, direction) {
    if (time < this.nextFireAt || time < this.uvOverheatUntil) {
      return;
    }

    if (this.resources.uvHeat >= MAX_UV_HEAT) {
      this.uvOverheatUntil = time + 1000;
      return;
    }

    this.resources.uvHeat = Phaser.Math.Clamp(this.resources.uvHeat + 6, 0, MAX_UV_HEAT);
    this.nextFireAt = time + 70;
    if (this.resources.uvHeat >= MAX_UV_HEAT) {
      this.uvOverheatUntil = time + 1000;
    }

    this.spawnProjectile({
      direction,
      speed: 670,
      damage: 22,
      lifetime: 520,
      scale: 0.9,
      tint: 0x8af7ff,
      weaponType: 'uvArcCutter'
    });
  }

  fireSporeNeedlegun(time, direction) {
    const profile = this.getSporeNeedlegunProfile();
    if (time < this.nextFireAt || this.resources.ammo < profile.ammoCost) {
      return;
    }

    this.resources.ammo = Math.max(0, this.resources.ammo - profile.ammoCost);
    this.nextFireAt = time + profile.cooldownMs;

    this.spawnProjectile({
      direction,
      speed: profile.projectileSpeed,
      damage: profile.damage,
      lifetime: profile.lifetimeMs,
      scale: 0.8,
      tint: 0x98ff9c,
      weaponType: 'sporeNeedlegun'
    });
  }

  firePulseShotgun(time, direction) {
    const profile = this.getPulseShotgunProfile();
    if (time < this.nextFireAt || this.resources.ammo < profile.ammoCost) {
      return;
    }

    this.resources.ammo = Math.max(0, this.resources.ammo - profile.ammoCost);
    this.nextFireAt = time + profile.cooldownMs;

    for (let pelletIndex = 0; pelletIndex < profile.pelletCount; pelletIndex += 1) {
      const spread = Phaser.Math.FloatBetween(-profile.spread, profile.spread);
      const pelletDirection = direction.clone().rotate(spread);

      this.spawnProjectile({
        direction: pelletDirection,
        speed: profile.projectileSpeed,
        damage: profile.pelletDamage,
        lifetime: profile.lifetimeMs,
        scale: 1.08,
        tint: 0xffdd8e,
        weaponType: 'pulseShotgun'
      });
    }
  }

  getLateSectorWeaponScalar() {
    return Phaser.Math.Clamp((this.sectorIndex - 10) / 2, 0, 1);
  }

  getSporeNeedlegunProfile() {
    const lateSectorScalar = this.getLateSectorWeaponScalar();

    return {
      ammoCost: 2,
      cooldownMs: 195 - Math.round(lateSectorScalar * 16),
      projectileSpeed: 790 + Math.round(lateSectorScalar * 20),
      damage: 30 + Math.round(lateSectorScalar * 2),
      lifetimeMs: 1180,
      stalkerBonus: 8 + Math.round(lateSectorScalar * 2)
    };
  }

  getPulseShotgunProfile() {
    const lateSectorScalar = this.getLateSectorWeaponScalar();

    return {
      ammoCost: 5,
      cooldownMs: 390 - Math.round(lateSectorScalar * 22),
      pelletCount: 5 + Math.floor(lateSectorScalar),
      pelletDamage: 9 + Math.round(lateSectorScalar),
      spread: 0.26 - lateSectorScalar * 0.03,
      projectileSpeed: 410 + Math.round(lateSectorScalar * 18),
      lifetimeMs: 300 + Math.round(lateSectorScalar * 20),
      knockbackStrength: 72 + Math.round(lateSectorScalar * 12)
    };
  }

  spawnProjectile({ direction, speed, damage, lifetime, scale, tint, weaponType }) {
    const bullet = this.projectiles.get(this.player.x, this.player.y, 'bullet');
    if (!bullet) {
      return;
    }

    bullet.clearTint();
    bullet.setTint(tint);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.enable = true;
    bullet.setCircle(6);
    bullet.setScale(scale);
    bullet.setPosition(this.player.x, this.player.y);
    bullet.setVelocity(direction.x * speed, direction.y * speed);
    bullet.damage = damage;
    bullet.setData('weaponType', weaponType);

    this.time.delayedCall(lifetime, () => {
      if (bullet.active) {
        bullet.disableBody(true, true);
      }
    });
  }

  updateWeaponSystems(dt, time, fireInputActive) {
    const currentWeapon = this.getCurrentWeapon();
    const usingUvCutter = currentWeapon.id === 'uvArcCutter' && fireInputActive;

    if (!usingUvCutter) {
      this.resources.uvHeat = Phaser.Math.Clamp(this.resources.uvHeat - 24 * dt, 0, MAX_UV_HEAT);
    }

  }

  updateSurvival(dt) {
    const oxygenDrain = this.isInSafeRoom() ? 0.8 : 1.8;
    const contaminationGain = this.isInSafeRoom() ? -6 : 2.5;

    this.resources.oxygen = Phaser.Math.Clamp(this.resources.oxygen - oxygenDrain * dt, 0, MAX_OXYGEN);
    this.resources.contamination = Phaser.Math.Clamp(this.resources.contamination + contaminationGain * dt, 0, MAX_CONTAMINATION);

    if (this.resources.health <= 0) {
      this.endRun();
    }
  }

  updateEnemies(time) {
    const activeNodes = this.getActiveObjectiveNodeCount();

    if (time > this.nextEnemySpawnAt && activeNodes > 0) {
      const totalEnemies = this.enemies.countActive(true);
      const maxActiveEnemies = this.getMaxActiveEnemies(activeNodes);
      if (totalEnemies < maxActiveEnemies) {
        const minSpawnDistance = this.getEnemyMinSpawnDistance(time);
        const useForwardSector = this.spawnedEnemyCount < FIRST_WAVE_FORWARD_SPAWNS;
        const spawnCount = Math.min(activeNodes, 2);
        for (let spawnIndex = 0; spawnIndex < spawnCount; spawnIndex += 1) {
          this.spawnEnemy(minSpawnDistance, useForwardSector);
        }
        this.waveLevel = Math.min(this.waveLevel + 0.12, 8);
      }
      this.nextEnemySpawnAt = time + Phaser.Math.Between(500, 950);
    }

    if (time > this.nextResourceSpawnAt) {
      this.spawnPickup();
      this.nextResourceSpawnAt = time + this.getPickupSpawnDelayMs();
    }

    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }

      const direction = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize();
      const speed = enemy.getData('speed');

      if (enemy.getData('type') === 'stalker' && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) > 320) {
        enemy.setAlpha(0.4);
      } else {
        enemy.setAlpha(1);
      }

      enemy.setVelocity(direction.x * speed, direction.y * speed);
    });

  }

  getEnemyMinSpawnDistance(time) {
    if (time - this.runStartedAt <= EARLY_GAME_WINDOW_MS) {
      return EARLY_MIN_SPAWN_DISTANCE;
    }

    return NORMAL_MIN_SPAWN_DISTANCE;
  }

  getMaxActiveEnemies(activeNodes) {
    const sectorPressureBonus = Math.floor(this.getSectorTemplateIndex() / 2);
    const wavePressureBonus = Math.floor(Math.max(0, this.waveLevel - 1) * 0.7);
    const progressionPressureBonus = this.getSectorProgressScalar() * 2.2;
    const baseEnemyBudget = 4 + activeNodes * 2;
    const softCap = 7 + activeNodes * 3 + sectorPressureBonus * 2 + progressionPressureBonus * 1.5;

    const targetBudget = baseEnemyBudget + sectorPressureBonus + wavePressureBonus + progressionPressureBonus;

    return Phaser.Math.Clamp(Math.round(targetBudget), 5, Math.round(softCap));
  }

  getPickupSpawnDelayMs() {
    const templateIndex = this.getSectorTemplateIndex();
    const reductionPerSector = templateIndex * 110;
    const minDelay = Phaser.Math.Clamp(3200 - reductionPerSector, 1800, 3200);
    const maxDelay = Phaser.Math.Clamp(5600 - reductionPerSector, 3000, 5600);

    return Phaser.Math.Between(minDelay, maxDelay);
  }

  getEnemyNodeSpawnClearancePx() {
    const scaledClearance = ENEMY_NODE_SPAWN_CLEARANCE_PX + this.getSectorTemplateIndex() * ENEMY_NODE_SPAWN_CLEARANCE_BONUS_PER_SECTOR;
    return Phaser.Math.Clamp(scaledClearance, ENEMY_NODE_SPAWN_CLEARANCE_PX, ENEMY_NODE_SPAWN_CLEARANCE_MAX_PX);
  }

  getPickupLifetimeMs() {
    const templateIndex = this.getSectorTemplateIndex();
    const scaledLifetime = PICKUP_BASE_LIFETIME_MS - templateIndex * Math.floor(PICKUP_LIFETIME_BONUS_PER_SECTOR_MS * 0.35);
    return Phaser.Math.Clamp(scaledLifetime, 5600, PICKUP_BASE_LIFETIME_MS);
  }

  spawnEnemy(minDistanceFromPlayer = NORMAL_MIN_SPAWN_DISTANCE, useForwardSector = false) {
    const spawnPosition = this.getSpawnPositionAwayFromPlayer(minDistanceFromPlayer, useForwardSector);
    const type = this.getEnemyTypeByRoll(Phaser.Math.Between(1, 100));

    const enemy = this.enemies.create(spawnPosition.x, spawnPosition.y, type);
    enemy.setCollideWorldBounds(true);
    enemy.clearTint();

    const enemyStats = this.getEnemyStats(type);
    enemy.health = enemyStats.health;
    enemy.setData('speed', enemyStats.speed);

    enemy.setData('type', type);
    this.spawnedEnemyCount += 1;
  }

  getSpawnPositionAwayFromPlayer(minDistanceFromPlayer, useForwardSector = false) {
    const nodeSpawnClearance = this.getEnemyNodeSpawnClearancePx();

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const edge = Phaser.Math.Between(0, 3);
      const position = this.getSpawnPositionByEdge(edge);
      const distanceToPlayer = Phaser.Math.Distance.Between(position.x, position.y, this.player.x, this.player.y);
      const validSector = !useForwardSector || this.isPositionInForwardSector(position);
      const clearOfActiveNodes = !this.isPositionNearActiveObjectiveNode(position, nodeSpawnClearance);
      if (distanceToPlayer >= minDistanceFromPlayer && validSector && clearOfActiveNodes) {
        return position;
      }
    }

    if (useForwardSector) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const edge = Phaser.Math.Between(0, 3);
        const position = this.getSpawnPositionByEdge(edge);
        const clearOfActiveNodes = !this.isPositionNearActiveObjectiveNode(position, nodeSpawnClearance);
        if (this.isPositionInForwardSector(position) && clearOfActiveNodes) {
          return position;
        }
      }
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const fallbackEdge = Phaser.Math.Between(0, 3);
      const fallbackPosition = this.getSpawnPositionByEdge(fallbackEdge);
      if (!this.isPositionNearActiveObjectiveNode(fallbackPosition, nodeSpawnClearance * 0.75)) {
        return fallbackPosition;
      }
    }

    const finalFallbackEdge = Phaser.Math.Between(0, 3);
    return this.getSpawnPositionByEdge(finalFallbackEdge);
  }

  isPositionNearActiveObjectiveNode(position, clearanceRadius) {
    if (!this.objectiveNodes) {
      return false;
    }

    return this.objectiveNodes.getChildren().some((node) => {
      if (!node.getData('active')) {
        return false;
      }

      const distance = Phaser.Math.Distance.Between(position.x, position.y, node.x, node.y);
      return distance < clearanceRadius;
    });
  }

  isPositionInForwardSector(position) {
    const toPosition = new Phaser.Math.Vector2(position.x - this.player.x, position.y - this.player.y);
    if (toPosition.lengthSq() === 0 || this.facingDirection.lengthSq() === 0) {
      return true;
    }

    const facing = this.facingDirection.clone().normalize();
    const directionToPosition = toPosition.normalize();
    const alignment = facing.dot(directionToPosition);

    return alignment >= FORWARD_SPAWN_DOT_THRESHOLD;
  }

  getSpawnPositionByEdge(edge) {
    const randomX = Phaser.Math.Between(60, WORLD_WIDTH - 60);
    const randomY = Phaser.Math.Between(60, WORLD_HEIGHT - 60);

    const positionByEdge = {
      0: { x: randomX, y: 60 },
      1: { x: WORLD_WIDTH - 60, y: randomY },
      2: { x: randomX, y: WORLD_HEIGHT - 60 },
      3: { x: 60, y: randomY }
    };

    return positionByEdge[edge] || positionByEdge[0];
  }

  getEnemyTypeByRoll(typeRoll) {
    const progression = this.getSectorProgressScalar();
    const stalkerThreshold = 94 - progression * 14;
    const bruteThreshold = 74 - progression * 10;

    if (typeRoll > stalkerThreshold) {
      return 'stalker';
    }
    if (typeRoll > bruteThreshold) {
      return 'brute';
    }
    return 'spore';
  }

  getEnemyStats(type) {
    const progression = this.getSectorProgressScalar();
    const healthMultiplier = 1 + progression * 0.45;

    const statsByType = {
      spore: {
        health: Math.round(40 * healthMultiplier + progression * 6),
        speed: Math.round(82 + this.waveLevel * 3 + progression * 14)
      },
      brute: {
        health: Math.round(80 * healthMultiplier + progression * 12),
        speed: Math.round(62 + this.waveLevel * 2 + progression * 10)
      },
      stalker: {
        health: Math.round(48 * healthMultiplier + progression * 8),
        speed: Math.round(118 + this.waveLevel * 4 + progression * 18)
      }
    };

    return statsByType[type] || statsByType.spore;
  }

  spawnPickup() {
    const weaponPickup = this.createWeaponPickupDefinition();
    const pickupTypeRoll = Phaser.Math.Between(1, 100);
    const pickupType = weaponPickup && pickupTypeRoll <= Math.round(this.getWeaponPickupChance() * 100)
      ? 'weapon'
      : pickupTypeRoll <= 60
        ? 'ammo'
        : pickupTypeRoll <= 85
          ? 'oxygen'
          : 'medkit';
    const spawnPosition = this.getValidPickupSpawnPosition();
    if (!spawnPosition) {
      return;
    }

    const pickupTexture = pickupType === 'weapon' ? 'weaponPickup' : pickupType;
    const pickup = this.pickups.create(
      spawnPosition.x,
      spawnPosition.y,
      pickupTexture
    );

    pickup.setData('type', pickupType);
    if (pickupType === 'weapon' && weaponPickup) {
      pickup.setData('weaponId', weaponPickup.weaponId);
    }
    this.time.delayedCall(this.getPickupLifetimeMs(), () => {
      if (pickup.active) {
        pickup.disableBody(true, true);
      }
    });
  }

  createWeaponPickupDefinition() {
    const candidates = WEAPON_UNLOCK_BY_SECTOR
      .filter((entry) => entry.sector <= this.sectorIndex && entry.weaponId !== DEFAULT_EQUIPPED_WEAPON_ID)
      .map((entry) => entry.weaponId)
      .filter((weaponId) => weaponId !== this.equippedWeaponId);

    if (candidates.length === 0) {
      return null;
    }

    const weaponId = Phaser.Utils.Array.GetRandom(candidates);
    return { weaponId };
  }

  getWeaponPickupChance() {
    const progressionBonus = this.getSectorProgressScalar() * 0.08;
    return Phaser.Math.Clamp(WEAPON_PICKUP_BASE_CHANCE + progressionBonus, WEAPON_PICKUP_BASE_CHANCE, 0.22);
  }

  getValidPickupSpawnPosition() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = Phaser.Math.Between(110, WORLD_WIDTH - 110);
      const y = Phaser.Math.Between(110, WORLD_HEIGHT - 110);

      if (this.isPositionBlockedByWall(x, y, PICKUP_WALL_PADDING_PX)) {
        continue;
      }
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 120) {
        continue;
      }
      if (this.isPositionNearSafeRoom(x, y, PICKUP_SAFE_ROOM_PADDING_PX)) {
        continue;
      }

      return { x, y };
    }

    return null;
  }

  isPositionNearSafeRoom(x, y, padding = 0) {
    if (!this.safeRoom) {
      return false;
    }

    const bounds = this.safeRoom.getBounds();
    const expandedBounds = new Phaser.Geom.Rectangle(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2
    );

    return expandedBounds.contains(x, y);
  }

  onProjectileHitEnemy(projectile, enemy) {
    projectile.disableBody(true, true);

    const weaponType = projectile.getData('weaponType');
    let totalDamage = projectile.damage;

    if (weaponType === 'incineratorCarbine') {
      totalDamage += 6;
      enemy.setTint(0xff8a5b);
      this.time.delayedCall(120, () => {
        if (enemy.active) {
          enemy.clearTint();
        }
      });
    } else if (weaponType === 'sporeNeedlegun' && enemy.getData('type') === 'stalker') {
      totalDamage += this.getSporeNeedlegunProfile().stalkerBonus;
      enemy.setTint(0xa9ffd4);
      this.time.delayedCall(90, () => {
        if (enemy.active) {
          enemy.clearTint();
        }
      });
    } else if (weaponType === 'pulseShotgun') {
      const pulseProfile = this.getPulseShotgunProfile();
      const projectileVelocity = projectile.body?.velocity;
      if (projectileVelocity) {
        const impulse = new Phaser.Math.Vector2(projectileVelocity.x, projectileVelocity.y);
        if (impulse.lengthSq() > 0) {
          impulse.normalize().scale(pulseProfile.knockbackStrength);
          enemy.setVelocity(enemy.body.velocity.x + impulse.x, enemy.body.velocity.y + impulse.y);
        }
      }
    }

    enemy.health -= totalDamage;
    this.showFloatingPickupText(`-${Math.ceil(totalDamage)}`, '#ffd48f', enemy.x, enemy.y - 18);
    if (enemy.health > 0) {
      this.showFloatingPickupText(`${Math.ceil(enemy.health)} HP`, '#ffe6ea', enemy.x, enemy.y - 34);
    }

    if (enemy.health <= 0) {
      enemy.disableBody(true, true);
    }
  }

  onProjectileHitNode(projectile, node) {
    projectile.disableBody(true, true);

    if (!node.getData('active')) {
      return;
    }

    const nodeHealth = (node.getData('health') ?? this.getObjectiveNodeHealth()) - projectile.damage;
    node.setData('health', nodeHealth);
    this.showFloatingPickupText(`NODE -${Math.ceil(projectile.damage)}`, '#cfc5ff', node.x, node.y - 18);

    if (nodeHealth > 0) {
      return;
    }

    node.setData('active', false);
    node.setTint(0x4ff0a8);
    node.setAlpha(0.55);

    this.objective.progress += 1;
    this.objective.nodesRemaining = this.getActiveObjectiveNodeCount();
    this.showFloatingPickupText('SPAWNER DISABLED', '#9ef0b2', node.x, node.y - 34);
  }

  getActiveObjectiveNodeCount() {
    return this.objectiveNodes
      .getChildren()
      .filter((node) => node.getData('active') === true).length;
  }

  onPlayerHitEnemy(player, enemy) {
    const contactDamageLockUntil = this.registry.get('contactDamageLockUntil') ?? 0;
    if (this.time.now < contactDamageLockUntil) {
      return;
    }

    if (this.isPlayerOverlappingAnyPickup()) {
      return;
    }

    if (this.time.now < this.pickupContactGraceUntil) {
      return;
    }

    if (this.time.now - this.lastPlayerHitAt < PLAYER_HIT_COOLDOWN_MS) {
      return;
    }

    const contactDistance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    if (contactDistance > CONTACT_HIT_DISTANCE_PX) {
      return;
    }

    const nextEnemyContactHitAt = enemy.getData('nextContactHitAt') ?? 0;
    if (this.time.now < nextEnemyContactHitAt) {
      return;
    }

    this.lastPlayerHitAt = this.time.now;
    enemy.setData('nextContactHitAt', this.time.now + ENEMY_CONTACT_HIT_COOLDOWN_MS);

    const enemyType = enemy.getData('type');
    const damageByType = {
      spore: 8,
      stalker: 10,
      brute: 14
    };
    const damage = damageByType[enemyType] ?? 10;
    this.resources.health = Phaser.Math.Clamp(this.resources.health - damage, 0, 100);
    this.showFloatingPickupText(`-${damage} HP`, '#ff8ea1', player.x, player.y - 28);

    this.player.setTint(0xff9db8);
    this.time.delayedCall(120, () => {
      if (this.player.active) {
        this.player.clearTint();
      }
    });

    const knockback = new Phaser.Math.Vector2(player.x - enemy.x, player.y - enemy.y).normalize().scale(285);
    this.playerRecoilUntil = this.time.now + PLAYER_RECOIL_DURATION_MS;
    this.playerRecoilVelocity.copy(knockback);
    this.player.setVelocity(knockback.x, knockback.y);
    enemy.setVelocity(-knockback.x * 0.35, -knockback.y * 0.35);
  }

  onPickupCollected(player, pickup) {
    const pickupType = pickup.getData('type');
    let pickupText = '';
    let pickupTextColor = '#b8ffd2';
    let pickupTextDurationMs = 550;

    this.pickupContactGraceUntil = this.time.now + PICKUP_CONTACT_GRACE_MS;
    this.lastPlayerHitAt = this.time.now;

    if (pickupType === 'ammo') {
      const nextAmmo = Math.min(this.resources.ammo + 26, 180);
      const nextFuel = Math.min(this.resources.fuel + 16, 120);
      const ammoGain = Math.max(0, Math.round(nextAmmo - this.resources.ammo));
      const fuelGain = Math.max(0, Math.round(nextFuel - this.resources.fuel));
      this.resources.ammo = nextAmmo;
      this.resources.fuel = nextFuel;

      pickupText = `AMMO +${ammoGain}  FUEL +${fuelGain}`;
      pickupTextColor = '#8ec1ff';
    } else if (pickupType === 'oxygen') {
      const nextOxygen = Math.min(this.resources.oxygen + 24, MAX_OXYGEN);
      const oxygenGain = Math.max(0, Math.round(nextOxygen - this.resources.oxygen));
      this.resources.oxygen = nextOxygen;
      this.resources.contamination = Math.max(this.resources.contamination - 18, 0);

      pickupText = `OXYGEN +${oxygenGain}`;
      pickupTextColor = '#8af7ff';
    } else if (pickupType === 'medkit') {
      const nextHealth = Math.min(this.resources.health + 22, 100);
      const nextOxygen = Math.min(this.resources.oxygen + 10, MAX_OXYGEN);
      const healthGain = Math.max(0, Math.round(nextHealth - this.resources.health));
      const oxygenGain = Math.max(0, Math.round(nextOxygen - this.resources.oxygen));

      this.resources.health = nextHealth;
      this.resources.oxygen = nextOxygen;
      this.resources.contamination = Math.max(this.resources.contamination - 10, 0);

      pickupText = `MEDKIT +${healthGain} HP`;
      if (oxygenGain > 0) {
        pickupText += `  +${oxygenGain} O2`;
      }
      pickupTextColor = '#ff9da7';
    } else if (pickupType === 'weapon') {
      const weaponId = pickup.getData('weaponId');
      const weapon = WEAPON_LOADOUT.find((loadoutWeapon) => loadoutWeapon.id === weaponId);
      if (weapon && weapon.id !== this.equippedWeaponId) {
        this.equippedWeaponId = weapon.id;
      }

      if (weapon) {
        pickupText = `Weapon Crate: ${weapon.label}`;
      } else {
        pickupText = 'Weapon Crate';
      }
      pickupTextColor = '#cab6ff';
      pickupTextDurationMs = 1160;
    } else {
      pickupText = 'PICKUP';
    }

    this.showFloatingPickupText(pickupText, pickupTextColor, pickup.x, pickup.y - 18, pickupTextDurationMs);

    this.player.setTint(0xb8ffd2);
    this.time.delayedCall(90, () => {
      if (this.player.active) {
        this.player.clearTint();
      }
    });

    pickup.disableBody(true, true);
  }

  isPlayerOverlappingAnyPickup() {
    const pickups = this.pickups?.getChildren() || [];
    for (let index = 0; index < pickups.length; index += 1) {
      const pickup = pickups[index];
      if (!pickup.active) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
      if (distance <= PICKUP_OVERLAP_PROTECTION_RADIUS_PX) {
        return true;
      }
    }

    return false;
  }

  updateNodeOverlapHint(time) {
    if (!NODE_OVERLAP_HINT_ENABLED) {
      return;
    }

    if (this.objective.stage !== 'destroyNodes') {
      return;
    }

    if (time < this.nextNodeOverlapHintCheckAt) {
      return;
    }
    this.nextNodeOverlapHintCheckAt = time + NODE_OVERLAP_HINT_SCAN_INTERVAL_MS;

    if (time < this.nextNodeOverlapHintAt) {
      return;
    }

    const nearbyNode = this.getNearestActiveObjectiveNode(this.player.x, this.player.y, NODE_OVERLAP_HINT_NODE_RADIUS_PX);
    if (!nearbyNode) {
      return;
    }

    const hasNearbyPickup = this.hasActivePickupNearPoint(nearbyNode.x, nearbyNode.y, NODE_OVERLAP_HINT_PICKUP_RADIUS_PX);
    if (!hasNearbyPickup) {
      return;
    }

    this.showFloatingPickupText('OBJECTIVE NODE: PURPLE CORE', '#d8ccff', nearbyNode.x, nearbyNode.y - 30);
    this.nextNodeOverlapHintAt = time + NODE_OVERLAP_HINT_COOLDOWN_MS;
  }

  getNearestActiveObjectiveNode(sourceX, sourceY, maxDistance) {
    const nodes = this.objectiveNodes?.getChildren() || [];
    let nearestNode = null;
    let nearestDistance = maxDistance;

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (!node.active || !node.getData('active')) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(sourceX, sourceY, node.x, node.y);
      if (distance > nearestDistance) {
        continue;
      }

      nearestDistance = distance;
      nearestNode = node;
    }

    return nearestNode;
  }

  hasActivePickupNearPoint(sourceX, sourceY, radius) {
    const pickups = this.pickups?.getChildren() || [];
    for (let index = 0; index < pickups.length; index += 1) {
      const pickup = pickups[index];
      if (!pickup.active) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(sourceX, sourceY, pickup.x, pickup.y);
      if (distance <= radius) {
        return true;
      }
    }

    return false;
  }

  showFloatingPickupText(message, color, x, y, durationMs = 550) {
    const feedback = this.add
      .text(x, y, message, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.tweens.add({
      targets: feedback,
      y: y - 20,
      alpha: 0,
      duration: durationMs,
      ease: 'Sine.easeOut',
      onComplete: () => feedback.destroy()
    });
  }

  updateObjectiveState() {
    this.objective.nodesRemaining = this.getActiveObjectiveNodeCount();

    if (this.objective.nodesRemaining > 0) {
      this.objective.stage = 'destroyNodes';
      this.objective.text = `Destroy infestation nodes: ${this.objective.progress}/${this.objective.required}`;
    } else if (this.enemies.countActive(true) > 0) {
      this.objective.stage = 'clearWaves';
      this.objective.text = `Clear remaining waves: ${this.enemies.countActive(true)} hostiles`;
    } else if (this.objective.stage === 'extract') {
      this.objective.text = 'Extraction available: move to the safe room';
      if (this.isInSafeRoom()) {
        this.completeSector();
      }
    } else {
      this.objective.stage = 'extract';
      this.objective.text = 'Extraction available: move to the safe room';
    }
  }

  completeSector() {
    if (this.hasQueuedSectorTransition) {
      return;
    }

    this.hasQueuedSectorTransition = true;
    this.state = 'transitioning';
    this.player.setVelocity(0, 0);
    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);
    this.pickups.clear(true, true);

    this.scene.start('SectorCompleteScene', {
      sectorIndex: this.sectorIndex,
      nextSectorIndex: this.sectorIndex + 1,
      carriedResources: { ...this.resources },
      carriedWeaponId: this.equippedWeaponId,
      carriedWaveLevel: this.waveLevel
    });
  }

  isInSafeRoom() {
    const safeBounds = this.safeRoom.getBounds();
    return Phaser.Geom.Rectangle.Contains(safeBounds, this.player.x, this.player.y);
  }

  updateHud() {
    const weapon = this.getCurrentWeapon();
    const ammoLabel = this.getWeaponAmmoLabel(weapon.id);
    const nodesRemaining = this.getActiveObjectiveNodeCount();
    const aliensRemaining = this.enemies.countActive(true);
    const nodesComplete = nodesRemaining === 0;
    const aliensComplete = nodesComplete && aliensRemaining === 0;
    const extractionReady = aliensComplete;
    const hudLines = [
      `Sector: ${this.sectorIndex}`,
      `HP: ${Math.ceil(this.resources.health)}`,
      `Weapon: ${weapon.label}`,
      `${ammoLabel}: ${this.getWeaponAmmoValue(weapon.id)}`
    ];

    if (this.gameplayTuningDebugEnabled) {
      const activeNodes = this.getActiveObjectiveNodeCount();
      const aliveEnemies = this.enemies.countActive(true);
      const maxEnemies = this.getMaxActiveEnemies(activeNodes);
      const nextPickupInMs = Math.max(0, this.nextResourceSpawnAt - this.time.now);

      hudLines.push(
        `DBG Nodes ${activeNodes}/${this.objective.required} HP:${this.getObjectiveNodeHealth()}`,
        `DBG Enemies ${aliveEnemies}/${maxEnemies} Wave:${this.waveLevel.toFixed(2)}`,
        `DBG Clearance ${this.getEnemyNodeSpawnClearancePx()} Pickup ${Math.ceil(nextPickupInMs / 1000)}s/${Math.ceil(this.getPickupLifetimeMs() / 1000)}s`,
        `DBG Layout ${this.getSectorTemplateIndex() + 1}/12 Band:${this.getSectorBandIndex() + 1}`
      );
    }

    this.hud.resources.setText(hudLines);
    this.hud.objectives.setColor('#ddf8d4');
    this.hud.objectives.setText([
      'Objectives',
      `${nodesComplete ? '[x]' : '[ ]'} Disable infestation nodes (${nodesRemaining} left)`,
      `${aliensComplete ? '[x]' : '[ ]'} Eliminate hostiles (${aliensRemaining} left)`,
      `${extractionReady ? '[x]' : '[ ]'} Reach extraction zone`
    ]);
  }

  getWeaponAmmoLabel(weaponId) {
    if (weaponId === 'incineratorCarbine') {
      return 'Fuel';
    }
    if (weaponId === 'uvArcCutter') {
      return 'UV Heat';
    }
    return 'Ammo';
  }

  getWeaponAmmoValue(weaponId) {
    if (weaponId === 'incineratorCarbine') {
      return Math.ceil(this.resources.fuel);
    }
    if (weaponId === 'uvArcCutter') {
      return Math.ceil(this.resources.uvHeat);
    }
    return Math.ceil(this.resources.ammo);
  }

  updateObjectiveText() {
    this.objective.text = `Sector ${this.sectorIndex}: destroy infestation nodes to stop enemy waves`;
  }

  onResumeFromPause() {
    const graceUntil = this.time.now + RESUME_CONTACT_GRACE_MS;
    this.pickupContactGraceUntil = Math.max(this.pickupContactGraceUntil, graceUntil);
    this.lastPlayerHitAt = this.time.now;
    this.registry.set('contactDamageLockUntil', graceUntil);
  }

  endRun() {
    if (this.hasQueuedGameOverTransition) {
      return;
    }

    this.hasQueuedGameOverTransition = true;
    this.state = 'ended';
    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);
    this.pickups.clear(true, true);
    this.player.setVelocity(0, 0);

    this.time.delayedCall(GAME_OVER_DELAY_MS, () => {
      if (!this.scene.isActive('GameScene')) {
        return;
      }

      this.scene.start('GameOverScene');
    });
  }
}
