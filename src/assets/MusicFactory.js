// MusicFactory.js — procedural heavy metal atmospheric background music
//
// Generates all audio entirely via the Web Audio API — no audio files needed.
// The engine uses a lookahead scheduler for seamless, jitter-free looping.
//
// Usage (via convenience helpers):
//   import { startBackgroundMusic, pauseBackgroundMusic,
//            resumeBackgroundMusic, stopBackgroundMusic } from './MusicFactory.js';
//
//   startBackgroundMusic(scene);          // call after first user gesture
//   pauseBackgroundMusic(scene);          // duck volume during pause menus
//   resumeBackgroundMusic(scene);         // restore volume
//   stopBackgroundMusic(scene);           // fade out and tear down

// ─── Timing ──────────────────────────────────────────────────────────────────

const BPM = 124;
const STEP = (60 / BPM) / 4;   // duration of one 16th note in seconds
const STEPS = 32;               // 2 bars of 16th notes per loop

// ─── Note table (Hz) ─────────────────────────────────────────────────────────

const NOTE = {
  E1: 41.20,
  E2: 82.41,
  Fs2: 92.50,
  G2: 98.00,
  A2: 110.00,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
};

// ─── Guitar riff (2-bar loop) ─────────────────────────────────────────────────
// Each entry: [startStep, noteKey, durationSteps, velocity 0–1]

const GUITAR = [
  // bar 1 — heavy downstroke feel
  [0,  'E2', 2, 1.00],
  [2,  'E2', 1, 0.75],
  [3,  'E2', 1, 0.85],
  [4,  'G2', 2, 0.90],
  [6,  'G2', 1, 0.68],
  [7,  'A2', 1, 0.80],
  [8,  'A2', 2, 0.95],
  [10, 'E2', 1, 0.72],
  [11, 'E2', 1, 0.80],
  [12, 'D3', 2, 0.90],
  [14, 'C3', 1, 0.82],
  [15, 'B2', 1, 0.74],
  // bar 2 — response phrase with tension rise
  [16, 'E2', 2, 1.00],
  [18, 'E2', 1, 0.75],
  [19, 'E2', 1, 0.88],
  [20, 'A2', 2, 0.92],
  [22, 'G2', 2, 0.85],
  [24, 'E2', 1, 0.95],
  [25, 'Fs2', 1, 0.78],
  [26, 'G2', 2, 0.88],
  [28, 'E2', 1, 0.70],
  [29, 'E2', 1, 0.80],
  [30, 'D3', 1, 0.85],
  [31, 'E3', 1, 0.95],
];

// ─── Drum pattern (2-bar, 32 steps) ──────────────────────────────────────────

const KICK         = new Set([0, 5, 8, 13, 16, 21, 24, 28, 29]);
const SNARE        = new Set([8, 24]);
const SNARE_GHOST  = new Set([4, 12, 20, 28]);
const HIHAT        = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]);
const HIHAT_OPEN   = new Set([6, 14, 22, 30]);
const CRASH        = new Set([0, 16]);

// ─── MusicEngine class ────────────────────────────────────────────────────────

export class MusicEngine {
  /**
   * @param {Phaser.Sound.WebAudioSoundManager} phaserSoundManager
   */
  constructor(phaserSoundManager) {
    this._ac = phaserSoundManager?.context ?? null;

    this._master    = null;   // master gain node
    this._drumBus   = null;   // drum sub-mix
    this._guitarBus = null;   // guitar sub-mix
    this._droneBus  = null;   // atmospheric drone sub-mix

    // Pre-baked noise buffers (generated once on start)
    this._kickNoiseBuf   = null;
    this._snareBuf       = null;
    this._hihatClosedBuf = null;
    this._hihatOpenBuf   = null;
    this._crashBuf       = null;

    // Long-running drone oscillators
    this._droneOscs   = [];
    this._droneLfo    = null;
    this._tremLfo     = null;

    // Scheduler state
    this._step          = 0;
    this._nextStepTime  = 0;
    this._timerHandle   = null;
    this._isPlaying     = false;
    this._isPaused      = false;

    // 'ambient' — drone only | 'full' — drums + guitar + drone
    this._mode        = 'ambient';

    this._volume      = 0.45;
    this._distCurve   = this._buildDistortionCurve(280);
  }

  get isPlaying() { return this._isPlaying; }
  get isPaused()  { return this._isPaused; }
  get mode()      { return this._mode; }

  // ── Public controls ──────────────────────────────────────────────────────

  /**
   * @param {number} [volume=0.45]
   * @param {'ambient'|'full'} [mode='full']
   */
  start(volume = 0.45, mode = 'full') {
    if (!this._ac || this._isPlaying) return;

    // Browsers suspend AudioContext until a user gesture — try to resume.
    if (this._ac.state === 'suspended') {
      this._ac.resume().catch(() => {});
    }

    this._mode   = mode;
    this._volume = volume;

    // Build node graph
    this._master = this._ac.createGain();
    this._master.gain.setValueAtTime(0, this._ac.currentTime);
    this._master.gain.linearRampToValueAtTime(this._volume, this._ac.currentTime + 3.0);
    this._master.connect(this._ac.destination);

    this._drumBus = this._ac.createGain();
    this._drumBus.gain.value = 0.72;
    this._drumBus.connect(this._master);

    this._guitarBus = this._ac.createGain();
    this._guitarBus.gain.value = 0.58;
    this._guitarBus.connect(this._master);

    this._droneBus = this._ac.createGain();
    this._droneBus.gain.setValueAtTime(0, this._ac.currentTime);
    this._droneBus.gain.linearRampToValueAtTime(0.16, this._ac.currentTime + 6.0);
    this._droneBus.connect(this._master);

    // Pre-bake noise buffers
    this._bakeNoiseBuffers();

    this._step         = 0;
    this._nextStepTime = this._ac.currentTime + 0.05;
    this._isPlaying    = true;
    this._isPaused     = false;

    this._startDrone();
    if (this._mode === 'full') {
      this._tick();
    }
  }

  /**
   * Switch between 'ambient' (drone only) and 'full' (drums + guitar + drone)
   * without restarting the drone layer.
   * @param {'ambient'|'full'} newMode
   */
  switchMode(newMode) {
    if (newMode === this._mode || !this._isPlaying) return;
    this._mode = newMode;

    if (newMode === 'full') {
      // Upgrade: restart the scheduler
      if (this._ac.state === 'suspended') {
        this._ac.resume().catch(() => {});
      }
      this._step = 0;
      this._nextStepTime = this._ac.currentTime + 0.12;
      this._tick();
    } else {
      // Downgrade to ambient: kill the scheduler; drone keeps running untouched
      clearTimeout(this._timerHandle);
      this._timerHandle = null;
    }
  }

  /** Fade-stop everything and release resources. */
  stop(fadeTime = 1.5) {
    if (!this._isPlaying) return;

    clearTimeout(this._timerHandle);
    this._timerHandle = null;
    this._isPlaying   = false;
    this._isPaused    = false;

    const now = this._ac.currentTime;

    if (this._master) {
      this._master.gain.cancelScheduledValues(now);
      this._master.gain.setTargetAtTime(0, now, fadeTime / 3.5);
    }

    // Tear down drone after the fade completes
    setTimeout(() => this._teardown(), (fadeTime + 0.8) * 1000);
  }

  /**
   * Duck the volume during pause menus.
   * The scheduler keeps running so resume is seamless.
   */
  pause() {
    if (!this._isPlaying || this._isPaused) return;
    this._isPaused = true;

    if (this._master) {
      const now = this._ac.currentTime;
      this._master.gain.cancelScheduledValues(now);
      this._master.gain.setTargetAtTime(this._volume * 0.18, now, 0.12);
    }
  }

  /** Restore full volume after a pause. */
  resume() {
    if (!this._isPlaying || !this._isPaused) return;
    this._isPaused = false;

    if (this._ac.state === 'suspended') {
      this._ac.resume().catch(() => {});
    }

    if (this._master) {
      const now = this._ac.currentTime;
      this._master.gain.cancelScheduledValues(now);
      this._master.gain.setTargetAtTime(this._volume, now, 0.15);
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._master && !this._isPaused) {
      this._master.gain.setTargetAtTime(this._volume, this._ac.currentTime, 0.06);
    }
  }

  // ── Scheduler ─────────────────────────────────────────────────────────────

  _tick() {
    if (!this._isPlaying || !this._ac || this._mode !== 'full') return;

    const lookahead = 0.14; // seconds to schedule ahead

    // If the AudioContext was suspended (e.g. browser autoplay block or page
    // hidden) and we've fallen more than one step behind current time, resync
    // to avoid a burst of back-to-back fired steps on resume.
    const now = this._ac.currentTime;
    if (this._nextStepTime < now - STEP * 2) {
      this._nextStepTime = now + 0.02;
    }

    const limit = this._ac.currentTime + lookahead;

    while (this._nextStepTime < limit) {
      this._scheduleStep(this._step, this._nextStepTime);
      this._step = (this._step + 1) % STEPS;
      this._nextStepTime += STEP;
    }

    // Fire next tick halfway before the lookahead window expires
    const msToNextWindow = (this._nextStepTime - this._ac.currentTime - lookahead) * 500;
    this._timerHandle = setTimeout(() => this._tick(), Math.max(8, msToNextWindow));
  }

  _scheduleStep(step, time) {
    // Guitar
    for (const [s, noteName, dur, vel] of GUITAR) {
      if (s === step) {
        this._powerChord(NOTE[noteName], time, dur * STEP * 0.88, vel);
      }
    }

    // Drums (crash before kick so the crash's high transient doesn't mask the kick click)
    if (CRASH.has(step))       this._crash(time, 0.55);
    if (KICK.has(step))        this._kick(time, step === 29 ? 0.65 : 1.0);
    if (SNARE.has(step))       this._snare(time, 0.9);
    if (SNARE_GHOST.has(step)) this._snare(time, 0.22);
    if (HIHAT_OPEN.has(step))  this._hihat(time, 0.42, true);
    else if (HIHAT.has(step))  this._hihat(time, step % 4 === 0 ? 0.28 : 0.16, false);
  }

  // ── Pre-bake noise buffers ────────────────────────────────────────────────

  _bakeNoiseBuffers() {
    const ac   = this._ac;
    const sr   = ac.sampleRate;

    // Kick transient click (25 ms white noise)
    this._kickNoiseBuf = this._noiseBuffer(ac, 0.025);

    // Snare body (220 ms white noise)
    this._snareBuf = this._noiseBuffer(ac, 0.22);

    // Closed hi-hat (35 ms noise + metallic overtones)
    this._hihatClosedBuf = this._metalNoiseBuf(ac, 0.035);

    // Open hi-hat (220 ms)
    this._hihatOpenBuf  = this._metalNoiseBuf(ac, 0.22);

    // Crash (1.4 s metallic noise)
    const crashLen  = Math.ceil(sr * 1.4);
    const crashBuf  = ac.createBuffer(1, crashLen, sr);
    const crashData = crashBuf.getChannelData(0);
    for (let i = 0; i < crashLen; i++) {
      const t = i / sr;
      crashData[i] = (Math.random() * 2 - 1) * 0.6
        + Math.sin(2 * Math.PI * 6000  * t) * 0.14
        + Math.sin(2 * Math.PI * 9500  * t) * 0.09
        + Math.sin(2 * Math.PI * 14200 * t) * 0.06;
    }
    this._crashBuf = crashBuf;
  }

  _noiseBuffer(ac, seconds) {
    const len  = Math.ceil(ac.sampleRate * seconds);
    const buf  = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _metalNoiseBuf(ac, seconds) {
    const sr   = ac.sampleRate;
    const len  = Math.ceil(sr * seconds);
    const buf  = ac.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      data[i] = (Math.random() * 2 - 1) * 0.72
        + Math.sin(2 * Math.PI * 8000  * t) * 0.18
        + Math.sin(2 * Math.PI * 12000 * t) * 0.10;
    }
    return buf;
  }

  // ── Instrument voices ──────────────────────────────────────────────────────

  /**
   * Three-note power chord: root, perfect fifth, octave.
   * Sawtooth oscillators → waveshaper distortion → cabinet LPF/mid-peak.
   */
  _powerChord(rootFreq, time, duration, velocity) {
    const ac = this._ac;

    const chordGain = ac.createGain();
    chordGain.gain.setValueAtTime(0, time);
    chordGain.gain.linearRampToValueAtTime(velocity * 0.28, time + STEP * 0.03);
    chordGain.gain.setTargetAtTime(velocity * 0.18, time + STEP * 0.08, 0.06);
    chordGain.gain.setTargetAtTime(0, time + duration * 0.62, 0.032);
    chordGain.connect(this._guitarBus);

    // Shared waveshaper for distortion (one per chord event is fine)
    const ws = ac.createWaveShaper();
    ws.curve    = this._distCurve;
    ws.oversample = '4x';
    // Cabinet tone shaping
    const lpf = ac.createBiquadFilter();
    lpf.type      = 'lowpass';
    lpf.frequency.value = 1900;
    lpf.Q.value   = 0.75;
    const mid = ac.createBiquadFilter();
    mid.type      = 'peaking';
    mid.frequency.value = 900;
    mid.gain.value = 5;
    mid.Q.value   = 1.4;

    ws.connect(lpf);
    lpf.connect(mid);
    mid.connect(chordGain);

    // Ratios: root, perfect fifth (3/2), octave
    const ratios  = [1, 1.4983, 2.0];
    const volumes = [0.55, 0.36, 0.24];

    for (let r = 0; r < ratios.length; r++) {
      const freq = rootFreq * ratios[r];

      // Two slightly detuned saws per voice for thickness
      for (const detune of [0, 5.5]) {
        const osc = ac.createOscillator();
        osc.type          = 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value  = detune;
        const vg = ac.createGain();
        vg.gain.value = volumes[r] * (detune === 0 ? 0.65 : 0.35);
        osc.connect(vg);
        vg.connect(ws);
        osc.start(time);
        osc.stop(time + duration + 0.16);
      }
    }
  }

  _kick(time, vel = 1.0) {
    const ac = this._ac;

    // Sub-bass body: pitched-down sine
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.075);
    const oscGain = ac.createGain();
    oscGain.gain.setValueAtTime(vel * 0.9, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.44);
    osc.connect(oscGain);
    oscGain.connect(this._drumBus);
    osc.start(time);
    osc.stop(time + 0.46);

    // Attack transient click
    const click = ac.createBufferSource();
    click.buffer = this._kickNoiseBuf;
    const clickGain = ac.createGain();
    clickGain.gain.setValueAtTime(vel * 0.5, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    const clickHpf = ac.createBiquadFilter();
    clickHpf.type = 'highpass';
    clickHpf.frequency.value = 900;
    click.connect(clickHpf);
    clickHpf.connect(clickGain);
    clickGain.connect(this._drumBus);
    click.start(time);
    click.stop(time + 0.028);
  }

  _snare(time, vel = 0.9) {
    const ac = this._ac;

    // Noise body
    const noise  = ac.createBufferSource();
    noise.buffer = this._snareBuf;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.72, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    const bpf = ac.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1400;
    bpf.Q.value = 0.72;
    noise.connect(bpf);
    bpf.connect(noiseGain);
    noiseGain.connect(this._drumBus);
    noise.start(time);
    noise.stop(time + 0.24);

    // Snare crack tone
    if (vel >= 0.5) {
      const tone = ac.createOscillator();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(215, time);
      tone.frequency.exponentialRampToValueAtTime(95, time + 0.075);
      const toneGain = ac.createGain();
      toneGain.gain.setValueAtTime(vel * 0.52, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      tone.connect(toneGain);
      toneGain.connect(this._drumBus);
      tone.start(time);
      tone.stop(time + 0.11);
    }
  }

  _hihat(time, vol = 0.28, isOpen = false) {
    const ac  = this._ac;
    const buf = isOpen ? this._hihatOpenBuf : this._hihatClosedBuf;
    const source = ac.createBufferSource();
    source.buffer = buf;

    const decay = isOpen ? 0.18 : 0.032;
    const gain  = ac.createGain();
    gain.gain.setValueAtTime(vol, time);
    if (isOpen) {
      gain.gain.setTargetAtTime(0, time + decay * 0.25, 0.045);
    } else {
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    }

    const hpf = ac.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 6800;
    const shelf = ac.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 10000;
    shelf.gain.value = 3.5;

    source.connect(hpf);
    hpf.connect(shelf);
    shelf.connect(gain);
    gain.connect(this._drumBus);
    source.start(time);
    source.stop(time + decay + 0.02);
  }

  _crash(time, vol = 0.55) {
    const ac     = this._ac;
    const source = ac.createBufferSource();
    source.buffer = this._crashBuf;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.setTargetAtTime(0, time + 0.06, 0.30);

    const hpf = ac.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 4200;

    source.connect(hpf);
    hpf.connect(gain);
    gain.connect(this._drumBus);
    source.start(time);
    source.stop(time + 1.5);
  }

  // ── Atmospheric drone ──────────────────────────────────────────────────────
  //
  // Three detuned sawtooth oscillators on E1 → dark low-pass filter swept by
  // a very slow LFO, plus a shimmery sine-pad layer on upper harmonics.

  _startDrone() {
    const ac = this._ac;

    // Main drone filter (dark, resonant)
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 3.2;
    filter.connect(this._droneBus);

    // Slow LFO sweeps the filter cutoff for movement
    this._droneLfo = ac.createOscillator();
    this._droneLfo.type = 'sine';
    this._droneLfo.frequency.value = 0.06;
    const lfoAmt = ac.createGain();
    lfoAmt.gain.value = 210;
    this._droneLfo.connect(lfoAmt);
    lfoAmt.connect(filter.frequency);
    this._droneLfo.start();

    // Very subtle tremolo on drone bus
    this._tremLfo = ac.createOscillator();
    this._tremLfo.type = 'sine';
    this._tremLfo.frequency.value = 0.19;
    const tremAmt = ac.createGain();
    tremAmt.gain.value = 0.038;
    this._tremLfo.connect(tremAmt);
    tremAmt.connect(this._droneBus.gain);
    this._tremLfo.start();

    // Sub/bass drone oscillators — three detunes of E1
    const droneFreqs = [NOTE.E1, NOTE.E1 * 1.0038, NOTE.E1 * 0.9964, NOTE.E2 * 0.501];
    for (const freq of droneFreqs) {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start();
      this._droneOscs.push(osc);
    }

    // Shimmer pad layer — sine oscillators on upper harmonics
    const padFilter = ac.createBiquadFilter();
    padFilter.type = 'bandpass';
    padFilter.frequency.value = 290;
    padFilter.Q.value = 1.6;
    padFilter.connect(this._droneBus);

    const padFreqs = [NOTE.E2 * 2, NOTE.B2, NOTE.E2 * 2 * 1.0022, NOTE.B2 * 0.9978];
    for (const freq of padFreqs) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ac.createGain();
      g.gain.value = 0.14;
      osc.connect(g);
      g.connect(padFilter);
      osc.start();
      this._droneOscs.push(osc);
    }
  }

  _teardown() {
    for (const osc of this._droneOscs) {
      try { osc.stop(); } catch (_) {}
      try { osc.disconnect(); } catch (_) {}
    }
    this._droneOscs = [];

    [this._droneLfo, this._tremLfo].forEach((osc) => {
      if (!osc) return;
      try { osc.stop(); } catch (_) {}
      try { osc.disconnect(); } catch (_) {}
    });
    this._droneLfo = null;
    this._tremLfo  = null;

    [this._master, this._drumBus, this._guitarBus, this._droneBus].forEach((node) => {
      if (!node) return;
      try { node.disconnect(); } catch (_) {}
    });
    this._master    = null;
    this._drumBus   = null;
    this._guitarBus = null;
    this._droneBus  = null;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Arctangent soft-clip distortion curve. */
  _buildDistortionCurve(amount) {
    const n     = 512;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Internal: get-or-create the shared engine, then start or switch mode.
 * @param {Phaser.Scene} scene
 * @param {'ambient'|'full'} mode
 * @param {number} volume
 * @returns {MusicEngine}
 */
function _getOrStartEngine(scene, mode, volume) {
  let engine = scene.registry.get('musicEngine');

  if (!engine) {
    engine = new MusicEngine(scene.sound);
    scene.registry.set('musicEngine', engine);
  }

  if (!engine.isPlaying) {
    engine.start(volume, mode);
  } else {
    engine.switchMode(mode);
  }

  return engine;
}

/**
 * Start (or switch to) atmospheric-only mode — drone, no drums or guitar.
 * Use this on title/menu/interstitial screens.
 *
 * @param {Phaser.Scene} scene
 * @param {number} [volume=0.45]
 * @returns {MusicEngine}
 */
export function startAmbientMusic(scene, volume = 0.45) {
  return _getOrStartEngine(scene, 'ambient', volume);
}

/**
 * Start (or switch to) full heavy-metal mode — drums + guitar + drone.
 * Use this during active gameplay.
 *
 * @param {Phaser.Scene} scene
 * @param {number} [volume=0.45]
 * @returns {MusicEngine}
 */
export function startFullMusic(scene, volume = 0.45) {
  return _getOrStartEngine(scene, 'full', volume);
}

/**
 * Duck the background music (e.g. when entering a pause or UI overlay).
 * @param {Phaser.Scene} scene
 */
export function pauseBackgroundMusic(scene) {
  const engine = scene.registry.get('musicEngine');
  engine?.pause();
}

/**
 * Restore the background music to full volume after a duck.
 * @param {Phaser.Scene} scene
 */
export function resumeBackgroundMusic(scene) {
  const engine = scene.registry.get('musicEngine');
  engine?.resume();
}

/**
 * Fade the music out and tear down the engine.
 * The registry key is cleared so the next call to `startBackgroundMusic`
 * creates a fresh engine.
 *
 * @param {Phaser.Scene} scene
 * @param {number} [fadeTime=1.5]
 */
export function stopBackgroundMusic(scene, fadeTime = 1.5) {
  const engine = scene.registry.get('musicEngine');
  if (engine) {
    engine.stop(fadeTime);
    scene.registry.set('musicEngine', null);
  }
}
