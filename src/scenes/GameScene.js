import Phaser from 'phaser';
import { getControlConfig } from '../config/controls.js';
import { DEBUG_TOOLS_ENABLED, isDebugFlagEnabled } from '../config/debug.js';

const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 1400;
const MAX_OXYGEN = 100;
const MAX_CONTAMINATION = 100;
const MAX_UV_HEAT = 100;
const DEFAULT_EQUIPPED_WEAPON_ID = 'shivPistol';
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
const OBJECTIVE_NODE_BASE_HEALTH = 130;
const OBJECTIVE_NODE_HEALTH_PER_SECTOR = 12;
const OBJECTIVE_NODE_MAX_HEALTH = 190;
const ENEMY_NODE_SPAWN_CLEARANCE_PX = 165;
const ENEMY_NODE_SPAWN_CLEARANCE_BONUS_PER_SECTOR = 8;
const ENEMY_NODE_SPAWN_CLEARANCE_MAX_PX = 210;
const PICKUP_BASE_LIFETIME_MS = 9000;
const PICKUP_LIFETIME_BONUS_PER_SECTOR_MS = 700;
const PICKUP_MAX_LIFETIME_MS = 13000;
const OBJECTIVE_NODE_WALL_CLEARANCE_PX = 52;
const OBJECTIVE_NODE_START_CLEARANCE_PX = 200;
const OBJECTIVE_NODE_MIN_SPACING_PX = 220;
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
  keys: 0,
  health: 100
};

const WEAPON_LOADOUT = [
  { id: 'shivPistol', label: 'Shiv Pistol' },
  { id: 'incineratorCarbine', label: 'Incinerator Carbine' },
  { id: 'uvArcCutter', label: 'UV Arc Cutter' }
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.keys = null;
    this.projectiles = null;
    this.enemies = null;
    this.pickups = null;
    this.boss = null;
    this.facingDirection = new Phaser.Math.Vector2(1, 0);
    this.nextFireAt = 0;
    this.nextEnemySpawnAt = 0;
    this.nextResourceSpawnAt = 0;
    this.waveLevel = 1;
    this.spawnedEnemyCount = 0;
    this.equippedWeaponId = DEFAULT_EQUIPPED_WEAPON_ID;
    this.uvOverheatUntil = 0;
    this.bossSuppressedUntil = 0;
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

    if (this.registry.get(PAUSE_BUTTON_ARMED_KEY) === undefined) {
      this.registry.set(PAUSE_BUTTON_ARMED_KEY, true);
    }

    this.updateObjectiveText();
  }

  resetRunState({ carryResources = false, carriedResources = null, carriedWeaponId = null, carriedWaveLevel = null } = {}) {
    this.facingDirection.set(1, 0);
    this.nextFireAt = 0;
    this.nextEnemySpawnAt = 0;
    this.nextResourceSpawnAt = 0;
    const sectorWaveBase = 1 + (this.sectorIndex - 1) * 0.35;
    this.waveLevel = Number.isFinite(carriedWaveLevel) ? carriedWaveLevel : sectorWaveBase;
    this.spawnedEnemyCount = 0;
    this.equippedWeaponId = typeof carriedWeaponId === 'string' ? carriedWeaponId : DEFAULT_EQUIPPED_WEAPON_ID;
    this.uvOverheatUntil = 0;
    this.bossSuppressedUntil = 0;
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
    graphics.fillStyle(0xff5b8f, 1);
    graphics.fillCircle(24, 24, 24);
    graphics.generateTexture('boss', 48, 48);

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
  }

  getSectorLayoutDefinition() {
    const themeIndex = (this.sectorIndex - 1) % 3;

    const layouts = [
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
      }
    ];

    return layouts[themeIndex];
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
    const themeIndex = (this.sectorIndex - 1) % 3;

    if (themeIndex === 1) {
      return [
        [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.2],
        [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.2],
        [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.2],
        [WORLD_WIDTH * 0.14, WORLD_HEIGHT * 0.8],
        [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.8],
        [WORLD_WIDTH * 0.86, WORLD_HEIGHT * 0.8],
        [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5]
      ];
    }

    if (themeIndex === 2) {
      return [
        [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.16],
        [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.28],
        [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.28],
        [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5],
        [WORLD_WIDTH * 0.22, WORLD_HEIGHT * 0.72],
        [WORLD_WIDTH * 0.78, WORLD_HEIGHT * 0.72],
        [WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.86]
      ];
    }

    return [
      [340, 260],
      [WORLD_WIDTH - 260, 260],
      [WORLD_WIDTH * 0.5, WORLD_HEIGHT - 260],
      [WORLD_WIDTH * 0.18, WORLD_HEIGHT * 0.82],
      [WORLD_WIDTH * 0.82, WORLD_HEIGHT * 0.82],
      [WORLD_WIDTH * 0.25, WORLD_HEIGHT * 0.34],
      [WORLD_WIDTH * 0.74, WORLD_HEIGHT * 0.62]
    ];
  }

  getRequiredNodeCount() {
    return Phaser.Math.Clamp(3 + Math.floor((this.sectorIndex - 1) / 3), 3, 5);
  }

  getObjectiveNodeHealth() {
    const scaledHealth = OBJECTIVE_NODE_BASE_HEALTH + (this.sectorIndex - 1) * OBJECTIVE_NODE_HEALTH_PER_SECTOR;
    return Phaser.Math.Clamp(scaledHealth, OBJECTIVE_NODE_BASE_HEALTH, OBJECTIVE_NODE_MAX_HEALTH);
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

      if (!blocked && !closeToStart && !tooCloseToOtherNodes) {
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

  buildSafeRoom() {
    this.safeRoom = this.add.rectangle(WORLD_WIDTH - 170, WORLD_HEIGHT - 170, 120, 120, 0x234f35, 0.35);
    this.physics.add.existing(this.safeRoom, true);
  }

  buildInput() {
    this.controls = getControlConfig(this.registry);
    this.keys = this.input.keyboard.addKeys(this.controls.keyboard);
    this.fallbackKeys = this.input.keyboard.addKeys({
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      w: 'W',
      a: 'A',
      s: 'S',
      d: 'D',
      sprint: 'SHIFT'
    });
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
    const keyboardPause = Phaser.Input.Keyboard.JustDown(this.keys.pause);

    if (this.time.now < pauseInputLockUntil) {
      this.syncGamepadButtonState(pauseButton);
      return keyboardPause;
    }

    const gamepadPause = this.canConsumePauseButtonPress(pauseButton);

    return keyboardPause || gamepadPause;
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

    const speed = this.isSprintActive() ? 285 : 200;
    const movementVector = this.getKeyboardMovementVector();
    this.applyGamepadMovementOverride(movementVector);

    if (movementVector.lengthSq() > 0) {
      this.facingDirection.copy(movementVector).normalize();
      this.player.rotation = this.facingDirection.angle();
    }

    movementVector.normalize().scale(speed);
    this.player.setVelocity(movementVector.x, movementVector.y);
  }

  isSprintActive() {
    return this.fallbackKeys.sprint.isDown;
  }

  getKeyboardMovementVector() {
    const movementX = this.getDirectionalAxisValue(
      this.isMovementActionDown('left'),
      this.isMovementActionDown('right')
    );
    const movementY = this.getDirectionalAxisValue(
      this.isMovementActionDown('up'),
      this.isMovementActionDown('down')
    );

    return new Phaser.Math.Vector2(movementX, movementY);
  }

  isMovementActionDown(action) {
    const mappedAction = this.keys?.[action];
    const mappedIsDown = mappedAction ? mappedAction.isDown : false;

    if (action === 'left') {
      return mappedIsDown || this.fallbackKeys.left.isDown || this.fallbackKeys.a.isDown;
    }
    if (action === 'right') {
      return mappedIsDown || this.fallbackKeys.right.isDown || this.fallbackKeys.d.isDown;
    }
    if (action === 'up') {
      return mappedIsDown || this.fallbackKeys.up.isDown || this.fallbackKeys.w.isDown;
    }

    return mappedIsDown || this.fallbackKeys.down.isDown || this.fallbackKeys.s.isDown;
  }

  getDirectionalAxisValue(negativeDirectionPressed, positiveDirectionPressed) {
    if (negativeDirectionPressed && !positiveDirectionPressed) {
      return -1;
    }
    if (positiveDirectionPressed && !negativeDirectionPressed) {
      return 1;
    }
    return 0;
  }

  applyGamepadMovementOverride(movementVector) {
    const axisX = this.getPrimaryGamepadAxisValue([0, 2]);
    const axisY = this.getPrimaryGamepadAxisValue([1, 3]);

    if (Math.abs(axisX) > 0.15) {
      movementVector.x = axisX * GAMEPAD_AXIS_MULTIPLIER_X;
    }
    if (Math.abs(axisY) > 0.15) {
      movementVector.y = axisY * GAMEPAD_AXIS_MULTIPLIER_Y;
    }
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
    const keyboardFire = this.keys.fire.isDown;
    const mouseFire = pointer.isDown;
    const fireButtons = this.controls.gamepad.fireButtons;
    const gamepadFire = fireButtons.some((buttonIndex) => this.isGamepadButtonPressed(buttonIndex));

    return keyboardFire || mouseFire || gamepadFire;
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

    this.fireUvArcCutter(time, direction);
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

    this.resources.fuel = Math.max(0, this.resources.fuel - 2);
    this.nextFireAt = time + 95;

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
      this.uvOverheatUntil = time + 1200;
      return;
    }

    this.resources.uvHeat = Phaser.Math.Clamp(this.resources.uvHeat + 12, 0, MAX_UV_HEAT);
    this.nextFireAt = time + 70;
    if (this.resources.uvHeat >= MAX_UV_HEAT) {
      this.uvOverheatUntil = time + 1200;
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
    const sectorPressureBonus = Math.floor((this.sectorIndex - 1) / 2);
    const wavePressureBonus = Math.floor(Math.max(0, this.waveLevel - 1) * 0.7);
    const baseEnemyBudget = 4 + activeNodes * 2;
    const softCap = 7 + activeNodes * 3 + sectorPressureBonus * 2;

    return Phaser.Math.Clamp(baseEnemyBudget + sectorPressureBonus + wavePressureBonus, 5, softCap);
  }

  getPickupSpawnDelayMs() {
    const reductionPerSector = (this.sectorIndex - 1) * 220;
    const minDelay = Phaser.Math.Clamp(3000 - reductionPerSector, 2200, 3000);
    const maxDelay = Phaser.Math.Clamp(5500 - reductionPerSector, 3800, 5500);

    return Phaser.Math.Between(minDelay, maxDelay);
  }

  getEnemyNodeSpawnClearancePx() {
    const scaledClearance = ENEMY_NODE_SPAWN_CLEARANCE_PX + (this.sectorIndex - 1) * ENEMY_NODE_SPAWN_CLEARANCE_BONUS_PER_SECTOR;
    return Phaser.Math.Clamp(scaledClearance, ENEMY_NODE_SPAWN_CLEARANCE_PX, ENEMY_NODE_SPAWN_CLEARANCE_MAX_PX);
  }

  getPickupLifetimeMs() {
    const scaledLifetime = PICKUP_BASE_LIFETIME_MS + (this.sectorIndex - 1) * PICKUP_LIFETIME_BONUS_PER_SECTOR_MS;
    return Phaser.Math.Clamp(scaledLifetime, PICKUP_BASE_LIFETIME_MS, PICKUP_MAX_LIFETIME_MS);
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
    if (typeRoll > 90) {
      return 'stalker';
    }
    if (typeRoll > 70) {
      return 'brute';
    }
    return 'spore';
  }

  getEnemyStats(type) {
    const statsByType = {
      spore: { health: 40, speed: 82 + this.waveLevel * 3 },
      brute: { health: 80, speed: 62 + this.waveLevel * 2 },
      stalker: { health: 48, speed: 118 + this.waveLevel * 4 }
    };

    return statsByType[type] || statsByType.spore;
  }

  spawnPickup() {
    const pickupTypeRoll = Phaser.Math.Between(1, 100);
    const pickupType = pickupTypeRoll <= 60 ? 'ammo' : pickupTypeRoll <= 85 ? 'oxygen' : 'medkit';
    const spawnPosition = this.getValidPickupSpawnPosition();
    if (!spawnPosition) {
      return;
    }

    const pickup = this.pickups.create(
      spawnPosition.x,
      spawnPosition.y,
      pickupType
    );

    pickup.setData('type', pickupType);
    this.time.delayedCall(this.getPickupLifetimeMs(), () => {
      if (pickup.active) {
        pickup.disableBody(true, true);
      }
    });
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
      brute: 14,
      boss: 18
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

    this.pickupContactGraceUntil = this.time.now + PICKUP_CONTACT_GRACE_MS;
    this.lastPlayerHitAt = this.time.now;

    if (pickupType === 'ammo') {
      const nextAmmo = Math.min(this.resources.ammo + 20, 180);
      const nextFuel = Math.min(this.resources.fuel + 12, 120);
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
    } else {
      pickupText = 'PICKUP';
    }

    this.showFloatingPickupText(pickupText, pickupTextColor, pickup.x, pickup.y - 18);

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

  showFloatingPickupText(message, color, x, y) {
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
      duration: 550,
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
        'DBG QA: S1-3 pass | corridor jams | rapid pause/restart | pickup grace | sector loop'
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
