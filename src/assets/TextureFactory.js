/**
 * TextureFactory — Generates all game textures as pixel art.
 *
 * Sprites are drawn using fillRect-only primitives for crisp, anti-alias-free
 * pixel art. Each animated entity is rendered to a horizontal spritesheet
 * (one row of frames), then frame definitions and Phaser animations are created.
 *
 * Call `buildAllTextures(scene)` once in scene.create() before building the world.
 */

// ============================= DRAWING HELPERS ==============================

function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function pixel(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** Filled ellipse — scanline raster, no anti-aliasing. */
function ellipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const span = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    ctx.fillRect(cx - span, cy + dy, span * 2 + 1, 1);
  }
}

/** Ring (outline of ellipse) — 1 px thick. */
function ellipseRing(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  let prevSpan = -1;
  for (let dy = -ry; dy <= ry; dy++) {
    const span = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    if (dy === -ry || dy === ry || span !== prevSpan) {
      ctx.fillRect(cx - span, cy + dy, span * 2 + 1, 1);
    } else {
      ctx.fillRect(cx - span, cy + dy, 1, 1);
      ctx.fillRect(cx + span, cy + dy, 1, 1);
    }
    prevSpan = span;
  }
}

/** Filled circle shorthand. */
function circle(ctx, cx, cy, r, color) {
  ellipse(ctx, cx, cy, r, r, color);
}

// ========================= TEXTURE KEY REGISTRY =============================

const TEXTURE_KEYS = [
  'player', 'bullet', 'spore', 'brute', 'stalker', 'node',
  'ammo', 'oxygen', 'medkit', 'weaponPickup',
  'spark', 'puff', 'muzzleFlash',
  'floorTile', 'wallTile', 'safeZoneTile'
];

function removeStaleTextures(scene) {
  TEXTURE_KEYS.forEach((key) => {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
  });
}

// ========================== PLAYER (24×24 × 4) ==============================

const PLAYER = {
  W: 32, H: 32, FRAMES: 4,
  out: '#141824', dark: '#2d3548', mid: '#475874',
  light: '#6b84a8', hi: '#8ca4c4',
  visor: '#a7f95d', visorBright: '#d4ffb3',
  skin: '#c8a882', skinDark: '#9a7a5a',
  boot: '#1e2630', beltBuckle: '#d4c466'
};

function buildPlayerTexture(scene) {
  const { W, H, FRAMES } = PLAYER;
  const tex = scene.textures.createCanvas('player', W * FRAMES, H);
  const ctx = tex.context;

  for (let f = 0; f < FRAMES; f++) {
    const ox = f * W;
    drawPlayerFrame(ctx, ox, f);
  }

  tex.refresh();
  for (let i = 0; i < FRAMES; i++) {
    tex.add(i, 0, i * W, 0, W, H);
  }
}

function drawPlayerFrame(ctx, ox, frame) {
  const cx = 16;
  const cy = 16;
  const armSwing = [0, -2, 0, 2][frame];
  const legSwing = [0, 1, 0, -1][frame];

  // Drop shadow
  ellipse(ctx, ox + cx, cy + 2, 12, 14, '#0a0e16');

  // ---- LEGS (below torso, visible at sides when facing right) ----
  // Left leg (top in sprite, shifts with walk)
  fill(ctx, ox + 8, 3 + legSwing, 5, 6, PLAYER.out);
  fill(ctx, ox + 9, 4 + legSwing, 3, 4, PLAYER.boot);
  // Right leg (bottom)
  fill(ctx, ox + 8, 23 - legSwing, 5, 6, PLAYER.out);
  fill(ctx, ox + 9, 24 - legSwing, 3, 4, PLAYER.boot);

  // ---- TORSO ----
  // Outline
  ellipse(ctx, ox + cx, cy, 11, 13, PLAYER.out);
  // Armor body
  ellipse(ctx, ox + cx, cy, 9, 11, PLAYER.dark);
  // Mid-tone upper body
  ellipse(ctx, ox + cx, cy - 1, 8, 9, PLAYER.mid);
  // Light chest plate
  ellipse(ctx, ox + cx + 1, cy - 1, 5, 6, PLAYER.light);
  // Highlight
  fill(ctx, ox + cx + 1, cy - 4, 2, 2, PLAYER.hi);

  // Belt line
  fill(ctx, ox + 6, cy + 5, 20, 2, PLAYER.out);
  fill(ctx, ox + 7, cy + 5, 18, 1, '#3a4a60');
  // Belt buckle
  fill(ctx, ox + cx - 1, cy + 5, 3, 2, PLAYER.beltBuckle);

  // ---- BACKPACK (left/rear side) ----
  fill(ctx, ox + 3, 10, 4, 12, PLAYER.out);
  fill(ctx, ox + 4, 11, 3, 10, '#3a4a60');
  fill(ctx, ox + 4, 14, 3, 2, '#4a5a70');

  // ---- ARMS ----
  // Top arm (character's left, swings with walk)
  fill(ctx, ox + 10, 2 + armSwing, 6, 5, PLAYER.out);
  fill(ctx, ox + 11, 3 + armSwing, 4, 3, PLAYER.mid);
  // Hand
  fill(ctx, ox + 14, 3 + armSwing, 2, 2, PLAYER.skin);

  // Bottom arm + weapon hand
  fill(ctx, ox + 10, 25 - armSwing, 6, 5, PLAYER.out);
  fill(ctx, ox + 11, 26 - armSwing, 4, 3, PLAYER.mid);
  fill(ctx, ox + 14, 26 - armSwing, 2, 2, PLAYER.skin);

  // ---- WEAPON (held in front / right side) ----
  fill(ctx, ox + 22, cy - 2, 7, 3, PLAYER.out);
  fill(ctx, ox + 23, cy - 1, 5, 1, '#7a8aaa');
  // Muzzle tip
  fill(ctx, ox + 28, cy - 2, 2, 3, '#5a6a80');
  // Grip connects to bottom hand
  fill(ctx, ox + 21, cy + 1, 3, 3, PLAYER.out);
  fill(ctx, ox + 22, cy + 2, 2, 1, PLAYER.dark);

  // ---- HEAD (front-facing, right side of sprite) ----
  // Helmet outline
  ellipse(ctx, ox + 21, cy, 5, 6, PLAYER.out);
  // Helmet fill
  ellipse(ctx, ox + 21, cy, 4, 5, PLAYER.dark);
  // Visor
  fill(ctx, ox + 24, cy - 3, 3, 6, PLAYER.visor);
  fill(ctx, ox + 25, cy - 2, 2, 4, PLAYER.visorBright);
  // Helmet ridge
  fill(ctx, ox + 18, cy - 2, 1, 4, PLAYER.mid);
  // Chin line
  fill(ctx, ox + 23, cy + 3, 2, 1, PLAYER.skinDark);
}

// ========================== SPORE (28×20 × 3) ===============================

const SPORE = {
  W: 28, H: 20, FRAMES: 3,
  out: '#1a3d1a', dark: '#2a5523', mid: '#3d7a35',
  light: '#5daa4e', bright: '#74d06e', spot: '#a3e890'
};

function buildSporeTexture(scene) {
  const { W, H, FRAMES } = SPORE;
  const tex = scene.textures.createCanvas('spore', W * FRAMES, H);
  const ctx = tex.context;

  for (let f = 0; f < FRAMES; f++) {
    drawSporeFrame(ctx, f * W, f);
  }

  tex.refresh();
  for (let i = 0; i < FRAMES; i++) {
    tex.add(i, 0, i * W, 0, W, H);
  }
}

function drawSporeFrame(ctx, ox, frame) {
  const cx = 14;
  const cy = 10;
  // Pulse: frame 0 = neutral, 1 = wider, 2 = taller
  const rxMod = [0, 1, -1][frame];
  const ryMod = [0, -1, 1][frame];

  // Shadow
  ellipse(ctx, ox + cx, cy + 1, 12 + rxMod, 8 + ryMod, '#0a1a0a');

  // Outline
  ellipse(ctx, ox + cx, cy, 12 + rxMod, 8 + ryMod, SPORE.out);

  // Body fill — dark
  ellipse(ctx, ox + cx, cy, 10 + rxMod, 6 + ryMod, SPORE.dark);

  // Mid layer
  ellipse(ctx, ox + cx, cy, 8 + rxMod, 5 + ryMod, SPORE.mid);

  // Light layer
  ellipse(ctx, ox + cx - 1, cy - 1, 5, 3 + ryMod, SPORE.light);

  // Bright centre
  ellipse(ctx, ox + cx - 2, cy - 1, 3, 2, SPORE.bright);

  // Nucleus / dark centre spot
  circle(ctx, ox + cx + 2, cy + 1, 2, SPORE.dark);

  // Surface spots — organic feel
  pixel(ctx, ox + cx + 5, cy - 2, SPORE.spot);
  pixel(ctx, ox + cx - 6, cy + 2, SPORE.spot);
  pixel(ctx, ox + cx + 3, cy + 3, SPORE.spot);
  pixel(ctx, ox + cx - 4, cy - 2, SPORE.spot);

  // Blobby bumps — small circles on edges
  circle(ctx, ox + cx + 9 + rxMod, cy - 1, 2, SPORE.mid);
  circle(ctx, ox + cx - 8 - rxMod, cy + 2, 2, SPORE.mid);
  circle(ctx, ox + cx + 4, cy - 6 - ryMod, 2, SPORE.mid);
}

// ========================== BRUTE (34×34 × 3) ===============================

const BRUTE = {
  W: 34, H: 34, FRAMES: 3,
  out: '#1a2e1a', shell: '#2a4a26', mid: '#3d6635',
  light: '#4ea14f', plate: '#5dbb55', eye: '#ff6644'
};

function buildBruteTexture(scene) {
  const { W, H, FRAMES } = BRUTE;
  const tex = scene.textures.createCanvas('brute', W * FRAMES, H);
  const ctx = tex.context;

  for (let f = 0; f < FRAMES; f++) {
    drawBruteFrame(ctx, f * W, f);
  }

  tex.refresh();
  for (let i = 0; i < FRAMES; i++) {
    tex.add(i, 0, i * W, 0, W, H);
  }
}

function drawBruteFrame(ctx, ox, frame) {
  const cx = 17;
  const cy = 17;
  const bulge = [0, 1, -1][frame];

  // Shadow
  fill(ctx, ox + 2, 4, 30 + bulge, 28 + bulge, '#0a160a');

  // Outline — large rounded body
  fill(ctx, ox + 3, 2, 28 + bulge, 30 + bulge, BRUTE.out);
  fill(ctx, ox + 2, 4, 30 + bulge, 26 + bulge, BRUTE.out);

  // Shell fill
  fill(ctx, ox + 5, 4, 24 + bulge, 26 + bulge, BRUTE.shell);
  fill(ctx, ox + 4, 6, 26 + bulge, 22 + bulge, BRUTE.shell);

  // Mid layer
  fill(ctx, ox + 6, 6, 22, 22, BRUTE.mid);

  // Light body centre
  fill(ctx, ox + 8, 8, 18, 18, BRUTE.light);

  // Armor plate stripes (horizontal ridges)
  for (let row = 0; row < 4; row++) {
    fill(ctx, ox + 7, 9 + row * 6, 20, 2, BRUTE.plate);
  }

  // Darker armored shoulder plates
  fill(ctx, ox + 4, 10, 4, 14, BRUTE.shell);
  fill(ctx, ox + 26, 10, 4, 14, BRUTE.shell);

  // Eyes — small orange/red dots near the front (right side)
  pixel(ctx, ox + 25, 13, BRUTE.eye);
  pixel(ctx, ox + 25, 15, BRUTE.eye);
  pixel(ctx, ox + 26, 13, '#ffaa44');
  pixel(ctx, ox + 26, 15, '#ffaa44');

  // Mouth / maw detail
  fill(ctx, ox + 27, 14, 2, 6, BRUTE.out);
  fill(ctx, ox + 28, 15, 1, 4, BRUTE.shell);
}

// ========================== STALKER (40×20 × 3) =============================

const STALKER = {
  W: 40, H: 20, FRAMES: 3,
  out: '#1d2d14', dark: '#3a5c2a', mid: '#5a8a42',
  light: '#7aaa55', bright: '#b7ff87', eye: '#ff4444'
};

function buildStalkerTexture(scene) {
  const { W, H, FRAMES } = STALKER;
  const tex = scene.textures.createCanvas('stalker', W * FRAMES, H);
  const ctx = tex.context;

  for (let f = 0; f < FRAMES; f++) {
    drawStalkerFrame(ctx, f * W, f);
  }

  tex.refresh();
  for (let i = 0; i < FRAMES; i++) {
    tex.add(i, 0, i * W, 0, W, H);
  }
}

function drawStalkerFrame(ctx, ox, frame) {
  const cy = 10;
  const segShift = [0, 1, -1][frame];

  // Body segments — 3 overlapping ellipses forming an arrow shape
  // Tail (left, wider)
  ellipse(ctx, ox + 10, cy, 9, 8, STALKER.out);
  ellipse(ctx, ox + 10, cy, 7, 6, STALKER.dark);
  ellipse(ctx, ox + 10, cy, 5, 4, STALKER.mid);

  // Mid-body (shifted per frame for slither effect)
  ellipse(ctx, ox + 20, cy + segShift, 9, 7, STALKER.out);
  ellipse(ctx, ox + 20, cy + segShift, 7, 5, STALKER.mid);
  ellipse(ctx, ox + 20, cy + segShift, 5, 3, STALKER.light);

  // Head (right, narrow and pointed)
  ellipse(ctx, ox + 31, cy, 8, 5, STALKER.out);
  ellipse(ctx, ox + 31, cy, 6, 3, STALKER.light);
  ellipse(ctx, ox + 31, cy, 4, 2, STALKER.bright);

  // Sharp front point
  fill(ctx, ox + 37, cy - 1, 2, 3, STALKER.bright);
  fill(ctx, ox + 38, cy, 1, 1, STALKER.out);

  // Eyes — red dots on head
  pixel(ctx, ox + 33, cy - 2, STALKER.eye);
  pixel(ctx, ox + 33, cy + 2, STALKER.eye);

  // Legs / feelers extending from segments
  const legColor = STALKER.dark;
  // Front feelers
  fill(ctx, ox + 35, cy - 4, 1, 2, legColor);
  fill(ctx, ox + 35, cy + 3, 1, 2, legColor);
  // Mid legs
  fill(ctx, ox + 22, cy - 6 + segShift, 1, 2, legColor);
  fill(ctx, ox + 22, cy + 5 + segShift, 1, 2, legColor);
  // Rear legs
  fill(ctx, ox + 12, cy - 7, 1, 2, legColor);
  fill(ctx, ox + 12, cy + 6, 1, 2, legColor);

  // Stripe pattern on mid segment
  fill(ctx, ox + 17, cy - 2 + segShift, 6, 1, STALKER.bright);
  fill(ctx, ox + 17, cy + 2 + segShift, 6, 1, STALKER.bright);
}

// ======================== OBJECTIVE NODE (22×22 × 4) ========================

const NODE = {
  W: 22, H: 22, FRAMES: 4,
  out: '#1a1a3d', dark: '#3d3575', mid: '#5d55aa',
  light: '#7d6dff', cross: '#c8c2ff', glow: '#a098ff'
};

function buildNodeTexture(scene) {
  const { W, H, FRAMES } = NODE;
  const tex = scene.textures.createCanvas('node', W * FRAMES, H);
  const ctx = tex.context;

  for (let f = 0; f < FRAMES; f++) {
    drawNodeFrame(ctx, f * W, f);
  }

  tex.refresh();
  for (let i = 0; i < FRAMES; i++) {
    tex.add(i, 0, i * W, 0, W, H);
  }
}

function drawNodeFrame(ctx, ox, frame) {
  const cx = 11;
  const cy = 11;

  // Pulsing glow — changes per frame
  const glowR = [10, 9, 8, 9][frame];
  circle(ctx, ox + cx, cy, glowR, NODE.out);

  // Body — square-ish crystal
  fill(ctx, ox + 3, 3, 16, 16, NODE.dark);
  fill(ctx, ox + 4, 2, 14, 18, NODE.dark);
  fill(ctx, ox + 2, 4, 18, 14, NODE.dark);

  // Inner crystal
  fill(ctx, ox + 5, 5, 12, 12, NODE.mid);

  // Cross pattern
  const crossBright = [NODE.cross, NODE.glow, NODE.cross, NODE.light][frame];
  fill(ctx, ox + 8, 3, 6, 16, crossBright);
  fill(ctx, ox + 3, 8, 16, 6, crossBright);

  // Centre glow
  const centreBright = [NODE.light, NODE.cross, NODE.glow, NODE.cross][frame];
  fill(ctx, ox + 8, 8, 6, 6, centreBright);

  // Corner dark notches — crystal facets
  pixel(ctx, ox + 4, 4, NODE.out);
  pixel(ctx, ox + 17, 4, NODE.out);
  pixel(ctx, ox + 4, 17, NODE.out);
  pixel(ctx, ox + 17, 17, NODE.out);

  // Edge glints
  pixel(ctx, ox + cx, 2, '#e0dcff');
  pixel(ctx, ox + cx, 19, '#e0dcff');
}

// ============================ BULLET (12×12) ================================

function buildBulletTexture(scene) {
  const tex = scene.textures.createCanvas('bullet', 12, 12);
  const ctx = tex.context;

  // Outer glow
  circle(ctx, 6, 6, 5, '#ffdd9940');
  // Mid ring
  circle(ctx, 6, 6, 4, '#ffc46680');
  // Core
  circle(ctx, 6, 6, 3, '#ffc466');
  // Bright centre
  circle(ctx, 6, 6, 2, '#ffe8b3');
  // Hot centre pixel
  pixel(ctx, 6, 5, '#fff8e8');

  tex.refresh();
}

// ========================== PICKUPS (16×16 × 2) =============================

function buildPickupTextures(scene) {
  buildAmmoTexture(scene);
  buildOxygenTexture(scene);
  buildMedkitTexture(scene);
  buildWeaponPickupTexture(scene);
}

function buildAmmoTexture(scene) {
  const tex = scene.textures.createCanvas('ammo', 32, 16);
  const ctx = tex.context;

  for (let f = 0; f < 2; f++) {
    const ox = f * 16;
    const hi = f === 1 ? '#a8c8ff' : '#71a2ff';

    // Outline
    fill(ctx, ox + 2, 1, 12, 14, '#0e1830');
    // Magazine body
    fill(ctx, ox + 3, 2, 10, 12, '#3a5a8a');
    // Mid fill
    fill(ctx, ox + 4, 3, 8, 10, hi);
    // Bullet tips (3 rows)
    fill(ctx, ox + 5, 4, 6, 2, '#d0e0ff');
    fill(ctx, ox + 5, 7, 6, 2, '#d0e0ff');
    fill(ctx, ox + 5, 10, 6, 2, '#d0e0ff');
    // Divider lines
    fill(ctx, ox + 4, 6, 8, 1, '#3a5a8a');
    fill(ctx, ox + 4, 9, 8, 1, '#3a5a8a');
    // Top cap
    fill(ctx, ox + 4, 2, 8, 1, '#5580b0');
  }

  tex.refresh();
  tex.add(0, 0, 0, 0, 16, 16);
  tex.add(1, 0, 16, 0, 16, 16);
}

function buildOxygenTexture(scene) {
  const tex = scene.textures.createCanvas('oxygen', 32, 16);
  const ctx = tex.context;

  for (let f = 0; f < 2; f++) {
    const ox = f * 16;
    const hi = f === 1 ? '#b8ffff' : '#8af7ff';

    // Cylinder outline
    fill(ctx, ox + 3, 2, 10, 12, '#0e2830');
    // Cylinder body
    fill(ctx, ox + 4, 3, 8, 10, '#2a6878');
    fill(ctx, ox + 5, 3, 6, 10, hi);
    // Valve top
    fill(ctx, ox + 6, 1, 4, 3, '#5aaabb');
    fill(ctx, ox + 7, 0, 2, 2, '#3a8a9a');
    // Pressure gauge
    fill(ctx, ox + 6, 7, 4, 3, '#2a5060');
    pixel(ctx, ox + 7, 8, '#40ffff');
    // Label stripe
    fill(ctx, ox + 5, 11, 6, 1, '#e0ffff');
  }

  tex.refresh();
  tex.add(0, 0, 0, 0, 16, 16);
  tex.add(1, 0, 16, 0, 16, 16);
}

function buildMedkitTexture(scene) {
  const tex = scene.textures.createCanvas('medkit', 32, 16);
  const ctx = tex.context;

  for (let f = 0; f < 2; f++) {
    const ox = f * 16;
    const bg = f === 1 ? '#ff5060' : '#d83b4c';
    const cross = f === 1 ? '#ffffff' : '#fff1f3';

    // Outline
    fill(ctx, ox + 1, 1, 14, 14, '#3a0e14');
    // Box body
    fill(ctx, ox + 2, 2, 12, 12, bg);
    // White cross
    fill(ctx, ox + 6, 3, 4, 10, cross);
    fill(ctx, ox + 3, 6, 10, 4, cross);
    // Shadow on cross
    fill(ctx, ox + 7, 4, 2, 8, '#ffe0e4');
    fill(ctx, ox + 4, 7, 8, 2, '#ffe0e4');
    // Latch detail
    fill(ctx, ox + 7, 13, 2, 1, '#aa2030');
  }

  tex.refresh();
  tex.add(0, 0, 0, 0, 16, 16);
  tex.add(1, 0, 16, 0, 16, 16);
}

function buildWeaponPickupTexture(scene) {
  const tex = scene.textures.createCanvas('weaponPickup', 36, 18);
  const ctx = tex.context;

  for (let f = 0; f < 2; f++) {
    const ox = f * 18;
    const hi = f === 1 ? '#ddd0ff' : '#cab6ff';

    // Outline
    fill(ctx, ox + 1, 1, 16, 16, '#1a1430');
    // Crate body
    fill(ctx, ox + 2, 2, 14, 14, '#433273');
    // Crate face
    fill(ctx, ox + 3, 3, 12, 12, hi);
    // Weapon silhouette (simple gun shape)
    fill(ctx, ox + 5, 7, 8, 3, '#433273');
    fill(ctx, ox + 4, 8, 2, 4, '#433273');
    fill(ctx, ox + 11, 6, 2, 2, '#433273');
    // Corner rivets
    pixel(ctx, ox + 3, 3, '#8070aa');
    pixel(ctx, ox + 14, 3, '#8070aa');
    pixel(ctx, ox + 3, 14, '#8070aa');
    pixel(ctx, ox + 14, 14, '#8070aa');
    // Lid line
    fill(ctx, ox + 3, 5, 12, 1, '#7a6aaa');
  }

  tex.refresh();
  tex.add(0, 0, 0, 0, 18, 18);
  tex.add(1, 0, 18, 0, 18, 18);
}

// ========================== PARTICLES (8×8) =================================

function buildParticleTextures(scene) {
  buildSparkTexture(scene);
  buildPuffTexture(scene);
  buildMuzzleFlashTexture(scene);
}

function buildSparkTexture(scene) {
  const tex = scene.textures.createCanvas('spark', 24, 8);
  const ctx = tex.context;

  // Frame 0 — bright star
  circle(ctx, 4, 4, 3, '#ffee88');
  fill(ctx, 4, 1, 1, 7, '#ffffff');
  fill(ctx, 1, 4, 7, 1, '#ffffff');
  pixel(ctx, 4, 4, '#ffffff');

  // Frame 1 — fading
  circle(ctx, 12, 4, 2, '#ffdd6680');
  fill(ctx, 12, 2, 1, 5, '#ffee88');
  fill(ctx, 10, 4, 5, 1, '#ffee88');

  // Frame 2 — dim
  circle(ctx, 20, 4, 1, '#ffcc4440');
  pixel(ctx, 20, 4, '#ffdd66');

  tex.refresh();
  tex.add(0, 0, 0, 0, 8, 8);
  tex.add(1, 0, 8, 0, 8, 8);
  tex.add(2, 0, 16, 0, 8, 8);
}

function buildPuffTexture(scene) {
  const tex = scene.textures.createCanvas('puff', 24, 8);
  const ctx = tex.context;

  // Frame 0 — small puff
  circle(ctx, 4, 4, 2, '#74d06e');
  circle(ctx, 4, 4, 1, '#a3e890');

  // Frame 1 — expanding
  circle(ctx, 12, 4, 3, '#5daa4e80');
  circle(ctx, 12, 4, 2, '#74d06e');

  // Frame 2 — dispersing
  circle(ctx, 20, 4, 3, '#3d7a3540');
  pixel(ctx, 19, 3, '#5daa4e60');
  pixel(ctx, 21, 5, '#5daa4e60');

  tex.refresh();
  tex.add(0, 0, 0, 0, 8, 8);
  tex.add(1, 0, 8, 0, 8, 8);
  tex.add(2, 0, 16, 0, 8, 8);
}

function buildMuzzleFlashTexture(scene) {
  const tex = scene.textures.createCanvas('muzzleFlash', 16, 8);
  const ctx = tex.context;

  // Frame 0 — bright flash
  circle(ctx, 4, 4, 3, '#ffffff');
  circle(ctx, 4, 4, 2, '#ffffcc');

  // Frame 1 — fading glow
  circle(ctx, 12, 4, 2, '#ffeeaa80');
  pixel(ctx, 12, 4, '#ffffff');

  tex.refresh();
  tex.add(0, 0, 0, 0, 8, 8);
  tex.add(1, 0, 8, 0, 8, 8);
}

// ========================= TILE TEXTURES (32×32) ============================

function buildTileTextures(scene, sectorLayout) {
  buildFloorTile(scene, sectorLayout);
  buildWallTile(scene, sectorLayout);
  buildSafeZoneTile(scene);
}

function buildFloorTile(scene, layout) {
  const tex = scene.textures.createCanvas('floorTile', 32, 32);
  const ctx = tex.context;

  // Base colour from sector palette
  const bg = layout.backgroundColor;
  const bgR = (bg >> 16) & 0xff;
  const bgG = (bg >> 8) & 0xff;
  const bgB = bg & 0xff;

  // Fill base
  ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  ctx.fillRect(0, 0, 32, 32);

  // Subtle grid lines (slightly lighter)
  const lineR = Math.min(255, bgR + 12);
  const lineG = Math.min(255, bgG + 12);
  const lineB = Math.min(255, bgB + 12);
  ctx.fillStyle = `rgb(${lineR},${lineG},${lineB})`;

  // Horizontal line at top
  ctx.fillRect(0, 0, 32, 1);
  // Vertical line at left
  ctx.fillRect(0, 0, 1, 32);
  // Mid cross
  ctx.fillRect(15, 0, 1, 32);
  ctx.fillRect(0, 15, 32, 1);

  // Panel corner dots
  const dotR = Math.min(255, bgR + 20);
  const dotG = Math.min(255, bgG + 20);
  const dotB = Math.min(255, bgB + 20);
  ctx.fillStyle = `rgb(${dotR},${dotG},${dotB})`;
  ctx.fillRect(1, 1, 2, 2);
  ctx.fillRect(29, 1, 2, 2);
  ctx.fillRect(1, 29, 2, 2);
  ctx.fillRect(29, 29, 2, 2);

  // Subtle random grime pixels
  const grimeR = Math.max(0, bgR - 8);
  const grimeG = Math.max(0, bgG - 8);
  const grimeB = Math.max(0, bgB - 8);
  ctx.fillStyle = `rgb(${grimeR},${grimeG},${grimeB})`;
  ctx.fillRect(7, 5, 1, 1);
  ctx.fillRect(22, 11, 1, 1);
  ctx.fillRect(4, 24, 1, 1);
  ctx.fillRect(26, 19, 1, 1);
  ctx.fillRect(12, 27, 1, 1);

  tex.refresh();
}

function buildWallTile(scene, layout) {
  const tex = scene.textures.createCanvas('wallTile', 32, 32);
  const ctx = tex.context;

  const wc = layout.wallColor;
  const wcR = (wc >> 16) & 0xff;
  const wcG = (wc >> 8) & 0xff;
  const wcB = wc & 0xff;

  // Base fill
  ctx.fillStyle = `rgb(${wcR},${wcG},${wcB})`;
  ctx.fillRect(0, 0, 32, 32);

  // Top highlight edge
  const hiR = Math.min(255, wcR + 20);
  const hiG = Math.min(255, wcG + 20);
  const hiB = Math.min(255, wcB + 20);
  ctx.fillStyle = `rgb(${hiR},${hiG},${hiB})`;
  ctx.fillRect(0, 0, 32, 2);
  ctx.fillRect(0, 0, 2, 32);

  // Bottom/right shadow edge
  const shR = Math.max(0, wcR - 15);
  const shG = Math.max(0, wcG - 15);
  const shB = Math.max(0, wcB - 15);
  ctx.fillStyle = `rgb(${shR},${shG},${shB})`;
  ctx.fillRect(0, 30, 32, 2);
  ctx.fillRect(30, 0, 2, 32);

  // Inner panel (inset)
  const inR = Math.max(0, wcR - 6);
  const inG = Math.max(0, wcG - 6);
  const inB = Math.max(0, wcB - 6);
  ctx.fillStyle = `rgb(${inR},${inG},${inB})`;
  ctx.fillRect(4, 4, 24, 24);

  // Rivet dots (4 corners of inner panel)
  ctx.fillStyle = `rgb(${hiR},${hiG},${hiB})`;
  ctx.fillRect(5, 5, 2, 2);
  ctx.fillRect(25, 5, 2, 2);
  ctx.fillRect(5, 25, 2, 2);
  ctx.fillRect(25, 25, 2, 2);

  // Central seam
  ctx.fillStyle = `rgb(${shR},${shG},${shB})`;
  ctx.fillRect(15, 4, 2, 24);

  tex.refresh();
}

function buildSafeZoneTile(scene) {
  const tex = scene.textures.createCanvas('safeZoneTile', 64, 32);
  const ctx = tex.context;

  for (let f = 0; f < 2; f++) {
    const ox = f * 32;
    const intensity = f === 0 ? 1.0 : 0.6;
    const alpha = Math.round(intensity * 255);

    // Dark base with green tint
    ctx.fillStyle = `rgba(15,40,25,${alpha})`;
    ctx.fillRect(ox, 0, 32, 32);

    // Green border glow
    const borderAlpha = f === 0 ? 180 : 100;
    ctx.fillStyle = `rgba(78,255,168,${borderAlpha / 255})`;
    ctx.fillRect(ox, 0, 32, 2);
    ctx.fillRect(ox, 30, 32, 2);
    ctx.fillRect(ox, 0, 2, 32);
    ctx.fillRect(ox + 30, 0, 2, 32);

    // Chevron arrows pointing inward (extraction symbol)
    ctx.fillStyle = `rgba(78,255,168,${Math.round(160 * intensity) / 255})`;
    // Top-left chevron
    ctx.fillRect(ox + 8, 8, 4, 2);
    ctx.fillRect(ox + 6, 10, 4, 2);
    // Bottom-right chevron
    ctx.fillRect(ox + 20, 20, 4, 2);
    ctx.fillRect(ox + 22, 22, 4, 2);
    // Centre cross
    ctx.fillRect(ox + 14, 12, 4, 8);
    ctx.fillRect(ox + 12, 14, 8, 4);
  }

  tex.refresh();
  tex.add(0, 0, 0, 0, 32, 32);
  tex.add(1, 0, 32, 0, 32, 32);
}

// ========================== ANIMATION DEFINITIONS ===========================

function buildAnimations(scene) {
  if (scene.anims.exists('player_walk')) {
    return;
  }

  scene.anims.create({
    key: 'player_walk',
    frames: buildFrameArray('player', 4),
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: 'player_idle',
    frames: [{ key: 'player', frame: 0 }],
    frameRate: 1,
    repeat: -1
  });

  scene.anims.create({
    key: 'spore_pulse',
    frames: buildFrameArray('spore', 3),
    frameRate: 4,
    repeat: -1,
    yoyo: true
  });

  scene.anims.create({
    key: 'brute_lumber',
    frames: buildFrameArray('brute', 3),
    frameRate: 3,
    repeat: -1,
    yoyo: true
  });

  scene.anims.create({
    key: 'stalker_skitter',
    frames: buildFrameArray('stalker', 3),
    frameRate: 6,
    repeat: -1,
    yoyo: true
  });

  scene.anims.create({
    key: 'node_pulse',
    frames: buildFrameArray('node', 4),
    frameRate: 3,
    repeat: -1
  });

  // Pickup glow — shared by all pickups (frames 0–1)
  ['ammo', 'oxygen', 'medkit', 'weaponPickup'].forEach((key) => {
    scene.anims.create({
      key: `${key}_glow`,
      frames: buildFrameArray(key, 2),
      frameRate: 2,
      repeat: -1,
      yoyo: true
    });
  });

  // Particle one-shot animations
  scene.anims.create({
    key: 'spark_burst',
    frames: buildFrameArray('spark', 3),
    frameRate: 14,
    repeat: 0
  });

  scene.anims.create({
    key: 'puff_fade',
    frames: buildFrameArray('puff', 3),
    frameRate: 10,
    repeat: 0
  });

  scene.anims.create({
    key: 'muzzle_flash',
    frames: buildFrameArray('muzzleFlash', 2),
    frameRate: 16,
    repeat: 0
  });

  scene.anims.create({
    key: 'safe_zone_pulse',
    frames: buildFrameArray('safeZoneTile', 2),
    frameRate: 2,
    repeat: -1,
    yoyo: true
  });
}

function buildFrameArray(textureKey, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({ key: textureKey, frame: i });
  }
  return frames;
}

// ============================== MAIN EXPORT =================================

/**
 * Build all game textures and register animations.
 * @param {Phaser.Scene} scene — the active scene (must be in create() phase)
 * @param {object} sectorLayout — the current sector's layout definition
 *        (from getSectorLayoutDefinition(), containing backgroundColor, wallColor, etc.)
 */
export function buildAllTextures(scene, sectorLayout) {
  removeStaleTextures(scene);

  // Entity sprites
  buildPlayerTexture(scene);
  buildSporeTexture(scene);
  buildBruteTexture(scene);
  buildStalkerTexture(scene);
  buildBulletTexture(scene);
  buildNodeTexture(scene);

  // Pickups
  buildPickupTextures(scene);

  // Particles
  buildParticleTextures(scene);

  // Sector-specific tiles
  buildTileTextures(scene, sectorLayout);

  // Animations (idempotent — skips if already registered)
  buildAnimations(scene);
}
