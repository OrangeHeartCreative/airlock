// SoundFactory.js — procedural Web Audio sound synthesis
// All sounds are generated as AudioBuffers and registered into Phaser's audio cache.

const SR = 22050; // sample rate for all generated buffers

// ─── Core helpers ────────────────────────────────────────────────────────────

function make(audioCtx, seconds) {
  const len = Math.ceil(SR * seconds);
  return audioCtx.createBuffer(1, len, SR);
}

function fill(buffer, fn) {
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / SR;
    data[i] = Math.max(-1, Math.min(1, fn(t)));
  }
}

function register(scene, key, buffer) {
  if (!scene.cache.audio.has(key)) {
    scene.cache.audio.add(key, buffer);
  }
}

function noise() {
  return Math.random() * 2 - 1;
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function exp(t, rate) {
  return Math.exp(-rate * t);
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ─── Weapon fire sounds ───────────────────────────────────────────────────────

function buildShivPistol(scene, ac) {
  const b = make(ac, 0.12);
  fill(b, (t) => {
    const crack = noise() * exp(t, 55) * 0.65;
    const body = sine(90, t) * exp(t, 28) * 0.3;
    return crack + body;
  });
  register(scene, 'sfx_shoot_shiv', b);
}

function buildIncinerator(scene, ac) {
  const b = make(ac, 0.18);
  fill(b, (t) => {
    const freq = lerp(380, 70, t / 0.14);
    const whoosh = noise() * exp(t, 16) * 0.5;
    const tone = sine(freq, t) * exp(t, 20) * 0.35;
    return whoosh + tone;
  });
  register(scene, 'sfx_shoot_incinerator', b);
}

function buildUvArc(scene, ac) {
  const b = make(ac, 0.1);
  fill(b, (t) => {
    const squarish = (noise() > 0 ? 1 : -1) * exp(t, 32) * 0.45;
    const zap = sine(1100 + sine(55, t) * 280, t) * exp(t, 38) * 0.4;
    return squarish + zap;
  });
  register(scene, 'sfx_shoot_uv', b);
}

function buildSporeNeedle(scene, ac) {
  const b = make(ac, 0.08);
  fill(b, (t) => {
    const freq = lerp(820, 280, t / 0.06);
    const thwip = sine(freq, t) * exp(t, 62) * 0.55;
    const hiss = noise() * exp(t, 85) * 0.2;
    return thwip + hiss;
  });
  register(scene, 'sfx_shoot_spore', b);
}

function buildPulseShotgun(scene, ac) {
  const b = make(ac, 0.28);
  fill(b, (t) => {
    const boom = noise() * exp(t, 11) * 0.6;
    const sub = sine(lerp(110, 28, t / 0.18), t) * exp(t, 9) * 0.5;
    const crack = t < 0.016 ? noise() * 0.4 : 0;
    return boom + sub + crack;
  });
  register(scene, 'sfx_shoot_shotgun', b);
}

// ─── Combat impact sounds ─────────────────────────────────────────────────────

function buildEnemyHit(scene, ac) {
  const b = make(ac, 0.09);
  fill(b, (t) => {
    const thud = noise() * exp(t, 52) * 0.5;
    const tone = sine(190, t) * exp(t, 42) * 0.3;
    return thud + tone;
  });
  register(scene, 'sfx_enemy_hit', b);
}

function buildEnemyDeath(scene, ac) {
  const b = make(ac, 0.2);
  fill(b, (t) => {
    const splat = noise() * exp(t, 18) * 0.55;
    const low = sine(lerp(280, 55, t / 0.12), t) * exp(t, 16) * 0.38;
    return splat + low;
  });
  register(scene, 'sfx_enemy_death', b);
}

function buildPlayerHit(scene, ac) {
  const b = make(ac, 0.22);
  fill(b, (t) => {
    const impact = noise() * exp(t, 22) * 0.6;
    const sting = sine(lerp(480, 110, t / 0.14), t) * exp(t, 18) * 0.38;
    return impact + sting;
  });
  register(scene, 'sfx_player_hit', b);
}

// ─── Pickup sounds ────────────────────────────────────────────────────────────

function buildPickupAmmo(scene, ac) {
  const b = make(ac, 0.16);
  fill(b, (t) => {
    const clink = sine(1380, t) * exp(t, 38) * 0.45;
    const ring = sine(2100, t) * exp(t, 55) * 0.28;
    return clink + ring;
  });
  register(scene, 'sfx_pickup_ammo', b);
}

function buildPickupOxygen(scene, ac) {
  const b = make(ac, 0.26);
  fill(b, (t) => {
    const env = t < 0.07 ? t / 0.07 : exp(t - 0.07, 11);
    const hiss = noise() * env * 0.45;
    const swoosh = sine(lerp(180, 580, t / 0.12), t) * env * 0.3;
    return hiss + swoosh;
  });
  register(scene, 'sfx_pickup_oxygen', b);
}

function buildPickupMedkit(scene, ac) {
  const b = make(ac, 0.32);
  fill(b, (t) => {
    const c1 = sine(880, t) * exp(t, 14) * 0.38;
    const c2 = sine(1320, t) * exp(Math.max(0, t - 0.05), 17) * 0.28;
    const c3 = sine(1760, t) * exp(Math.max(0, t - 0.1), 21) * 0.18;
    return c1 + c2 + c3;
  });
  register(scene, 'sfx_pickup_medkit', b);
}

function buildPickupWeapon(scene, ac) {
  const b = make(ac, 0.28);
  fill(b, (t) => {
    const clunk = noise() * exp(t, 18) * 0.5;
    const tone = sine(300, t) * exp(t, 14) * 0.38;
    const ring = sine(600, t) * exp(t, 24) * 0.2;
    return clunk + tone + ring;
  });
  register(scene, 'sfx_pickup_weapon', b);
}

// ─── Objective node sounds ────────────────────────────────────────────────────

function buildNodeHit(scene, ac) {
  const b = make(ac, 0.1);
  fill(b, (t) => {
    const crunch = noise() * exp(t, 46) * 0.58;
    const low = sine(115, t) * exp(t, 36) * 0.28;
    return crunch + low;
  });
  register(scene, 'sfx_node_hit', b);
}

function buildNodeDestroy(scene, ac) {
  const b = make(ac, 0.55);
  fill(b, (t) => {
    const bang = noise() * exp(t, 7) * 0.6;
    const sub = sine(lerp(190, 38, t / 0.32), t) * exp(t, 5.5) * 0.5;
    const tail = noise() * exp(t, 18) * 0.18;
    return bang + sub + tail;
  });
  register(scene, 'sfx_node_destroy', b);
}

// ─── Extraction / safe room ───────────────────────────────────────────────────

function buildExtract(scene, ac) {
  const b = make(ac, 0.42);
  const notes = [523, 659, 784]; // C5, E5, G5
  fill(b, (t) => {
    let sum = 0;
    notes.forEach((freq, i) => {
      const onset = i * 0.065;
      if (t >= onset) {
        sum += sine(freq, t - onset) * exp(t - onset, 11) * 0.3;
      }
    });
    return sum;
  });
  register(scene, 'sfx_extract', b);
}

// ─── UI sounds ────────────────────────────────────────────────────────────────

function buildUINavigate(scene, ac) {
  const b = make(ac, 0.06);
  fill(b, (t) => sine(720, t) * exp(t, 75) * 0.38);
  register(scene, 'sfx_ui_navigate', b);
}

function buildUIConfirm(scene, ac) {
  const b = make(ac, 0.14);
  fill(b, (t) => {
    const f = t < 0.07 ? 620 : 880;
    const onset = t < 0.07 ? 0 : 0.07;
    return sine(f, t) * exp(t - onset, 26) * 0.48;
  });
  register(scene, 'sfx_ui_confirm', b);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildUISounds(scene) {
  const ac = scene.sound?.context;
  if (!ac) {
    return;
  }

  buildUINavigate(scene, ac);
  buildUIConfirm(scene, ac);
}

export function buildAllSounds(scene) {
  const ac = scene.sound?.context;
  if (!ac) {
    return;
  }

  buildShivPistol(scene, ac);
  buildIncinerator(scene, ac);
  buildUvArc(scene, ac);
  buildSporeNeedle(scene, ac);
  buildPulseShotgun(scene, ac);

  buildEnemyHit(scene, ac);
  buildEnemyDeath(scene, ac);
  buildPlayerHit(scene, ac);

  buildPickupAmmo(scene, ac);
  buildPickupOxygen(scene, ac);
  buildPickupMedkit(scene, ac);
  buildPickupWeapon(scene, ac);

  buildNodeHit(scene, ac);
  buildNodeDestroy(scene, ac);

  buildExtract(scene, ac);

  buildUINavigate(scene, ac);
  buildUIConfirm(scene, ac);
}
