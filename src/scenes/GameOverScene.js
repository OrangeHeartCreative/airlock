import Phaser from 'phaser';

const GAMEPAD_CONFIRM_BUTTON = 0;
const GAMEPAD_START_BUTTON = 9;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.transitionQueued = false;
    this.previousGamepadButtons = {};
  }

  create() {
    this.transitionQueued = false;
    this.previousGamepadButtons = {};

    this.keys = this.input.keyboard.addKeys({
      confirm: 'ENTER'
    });

    if (this.input.gamepad) {
      this.input.gamepad.once('connected', (pad) => {
        this.pad = pad;
      });
      if (this.input.gamepad.total > 0) {
        this.pad = this.input.gamepad.getPad(0);
      }
    }

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050b08);

    this.add.text(width / 2, height * 0.4, 'Game Over', {
      fontFamily: 'Arial',
      fontSize: '72px',
      color: '#f4d1d6'
    }).setOrigin(0.5);

    const restartButton = this.add
      .rectangle(width / 2, height * 0.62, 240, 68, 0x2f4a3f)
      .setStrokeStyle(2, 0xd4f5c6)
      .setInteractive({ useHandCursor: true });

    const restartLabel = this.add.text(width / 2, height * 0.62, 'Restart', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#d4f5c6'
    }).setOrigin(0.5);

    restartButton.on('pointerdown', () => {
      this.restartRun();
    });

    restartButton.on('pointerover', () => {
      restartButton.setFillStyle(0x3b5a4c);
      restartLabel.setColor('#f0ffd7');
    });

    restartButton.on('pointerout', () => {
      restartButton.setFillStyle(0x2f4a3f);
      restartLabel.setColor('#d4f5c6');
    });
  }

  update() {
    if (this.transitionQueued) {
      return;
    }

    const keyboardConfirm = Phaser.Input.Keyboard.JustDown(this.keys.confirm);
    const gamepadConfirm = this.isGamepadButtonJustPressed(GAMEPAD_CONFIRM_BUTTON)
      || this.isGamepadButtonJustPressed(GAMEPAD_START_BUTTON);

    if (keyboardConfirm || gamepadConfirm) {
      this.restartRun();
    }
  }

  isGamepadButtonPressed(buttonIndex) {
    if (this.pad && this.pad.buttons.length > buttonIndex) {
      return this.pad.buttons[buttonIndex].pressed;
    }

    const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
    if (!browserNavigator || !browserNavigator.getGamepads) {
      return false;
    }

    const pads = browserNavigator.getGamepads();
    for (let index = 0; index < pads.length; index += 1) {
      const browserPad = pads[index];
      if (browserPad && browserPad.buttons && browserPad.buttons.length > buttonIndex && browserPad.buttons[buttonIndex].pressed) {
        return true;
      }
    }

    return false;
  }

  isGamepadButtonJustPressed(buttonIndex) {
    const pressedNow = this.isGamepadButtonPressed(buttonIndex);
    const wasPressed = this.previousGamepadButtons[buttonIndex] === true;
    this.previousGamepadButtons[buttonIndex] = pressedNow;
    return pressedNow && !wasPressed;
  }

  restartRun() {
    if (this.transitionQueued) {
      return;
    }

    this.transitionQueued = true;
    this.registry.set('sectorIndex', 1);
    this.scene.start('GameScene', {
      sectorIndex: 1,
      carryResources: false
    });
  }
}