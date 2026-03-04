import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { StartScene } from './scenes/StartScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { SectorCompleteScene } from './scenes/SectorCompleteScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { isDebugFlagEnabled } from './config/debug.js';

function isDebugOverlayEnabled() {
  return isDebugFlagEnabled('debug');
}

function createDebugOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'debug-overlay';
  overlay.style.position = 'fixed';
  overlay.style.left = '8px';
  overlay.style.bottom = '8px';
  overlay.style.maxWidth = '60vw';
  overlay.style.maxHeight = '45vh';
  overlay.style.overflow = 'auto';
  overlay.style.zIndex = '9999';
  overlay.style.background = 'rgba(0, 0, 0, 0.82)';
  overlay.style.color = '#9affc4';
  overlay.style.border = '1px solid rgba(154, 255, 196, 0.35)';
  overlay.style.padding = '8px 10px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.fontSize = '12px';
  overlay.style.whiteSpace = 'pre-wrap';
  overlay.style.pointerEvents = 'none';

  const lines = [];
  const pushLine = (line) => {
    lines.push(line);
    if (lines.length > 16) {
      lines.shift();
    }
    overlay.textContent = lines.join('\n');
  };

  document.body.appendChild(overlay);
  pushLine('[boot] overlay ready');

  window.addEventListener('error', (event) => {
    const message = event?.error?.stack || event?.message || 'Unknown error';
    pushLine(`[error] ${message}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event?.reason?.stack || event?.reason || 'Unhandled rejection';
    pushLine(`[rejection] ${message}`);
  });

  return { pushLine };
}

const debugEnabled = isDebugOverlayEnabled();
const debug = debugEnabled ? createDebugOverlay() : null;
if (debugEnabled) {
  debug.pushLine('[boot] creating Phaser game');
}

const config = {
  type: Phaser.CANVAS,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#07100b',
  pixelArt: true,
  input: {
    gamepad: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [StartScene, GameScene, PauseScene, SectorCompleteScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
if (debugEnabled) {
  debug.pushLine(`[boot] renderer=${game.config.renderType === Phaser.CANVAS ? 'canvas' : 'webgl'}`);
  debug.pushLine('[boot] scenes registered: StartScene, GameScene, PauseScene, SectorCompleteScene, GameOverScene');
}

// Autostart hooks removed for release builds.
// (They were used for local tooling and automated screenshot capture.)
