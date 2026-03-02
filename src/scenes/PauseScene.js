import Phaser from 'phaser';
import { getControlConfig } from '../config/controls.js';

const PAUSE_BUTTON_ARMED_KEY = 'pauseButtonArmed';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
    this.selectedOption = 0;
    this.options = ['Resume', 'Restart Sector', 'SFX Volume'];
    this.pauseInputLockUntil = 0;
    this.previousGamepadButtons = {};
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58);

    this.add.text(width / 2, height * 0.24, 'PAUSED', {
      fontFamily: 'Arial',
      fontSize: '54px',
      color: '#d9f6cb'
    }).setOrigin(0.5);

    this.optionTexts = this.options.map((_, index) => {
      return this.add.text(width / 2, height * 0.44 + index * 56, '', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#e7f2eb'
      }).setOrigin(0.5);
    });

    this.helpText = this.add.text(width / 2, height * 0.82, '↑/↓ Navigate  •  Enter/A Confirm  •  ←/→ Adjust Volume  •  Esc Resume', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#f6dcb5'
    }).setOrigin(0.5);

    this.keys = this.input.keyboard.addKeys({
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      confirm: 'ENTER',
      resume: 'ESC'
    });

    if (this.input.gamepad) {
      this.input.gamepad.once('connected', (pad) => {
        this.pad = pad;
      });

      if (this.input.gamepad.total > 0) {
        this.pad = this.input.gamepad.getPad(0);
      }
    }

    this.controls = getControlConfig(this.registry);
    this.pauseInputLockUntil = this.time.now + 260;

    if (this.registry.get(PAUSE_BUTTON_ARMED_KEY) === undefined) {
      this.registry.set(PAUSE_BUTTON_ARMED_KEY, true);
    }

    this.refreshMenu();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.resume) || this.isGamepadPauseJustPressed()) {
      this.resumeGame();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.up) || this.isGamepadUpPressed()) {
      this.selectedOption = Phaser.Math.Wrap(this.selectedOption - 1, 0, this.options.length);
      this.refreshMenu();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.down) || this.isGamepadDownPressed()) {
      this.selectedOption = Phaser.Math.Wrap(this.selectedOption + 1, 0, this.options.length);
      this.refreshMenu();
    }

    if (this.selectedOption === 2 && (Phaser.Input.Keyboard.JustDown(this.keys.left) || this.isGamepadLeftPressed())) {
      this.adjustVolume(-0.1);
    }

    if (this.selectedOption === 2 && (Phaser.Input.Keyboard.JustDown(this.keys.right) || this.isGamepadRightPressed())) {
      this.adjustVolume(0.1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm) || this.isGamepadConfirmPressed()) {
      this.confirmSelection();
    }
  }

  isGamepadPauseJustPressed() {
    const pauseButton = this.controls?.gamepad?.pauseButton ?? 9;
    const isPressed = this.pad ? this.pad.buttons[pauseButton]?.pressed === true : false;
    const isArmed = this.registry.get(PAUSE_BUTTON_ARMED_KEY) !== false;

    if (!isPressed) {
      this.registry.set(PAUSE_BUTTON_ARMED_KEY, true);
      this.syncGamepadButtonState(pauseButton);
      return false;
    }

    if (this.time.now < this.pauseInputLockUntil) {
      this.syncGamepadButtonState(pauseButton);
      return false;
    }

    if (!isArmed) {
      this.syncGamepadButtonState(pauseButton);
      return false;
    }

    const justPressed = this.isGamepadButtonJustPressed(pauseButton);
    if (!justPressed) {
      return false;
    }

    this.registry.set(PAUSE_BUTTON_ARMED_KEY, false);
    return true;
  }

  syncGamepadButtonState(buttonIndex) {
    const isPressed = this.pad ? this.pad.buttons[buttonIndex]?.pressed === true : false;
    this.previousGamepadButtons[buttonIndex] = isPressed;
  }

  isGamepadButtonJustPressed(buttonIndex) {
    const isPressed = this.pad ? this.pad.buttons[buttonIndex]?.pressed === true : false;
    const wasPressed = this.previousGamepadButtons[buttonIndex] === true;
    this.previousGamepadButtons[buttonIndex] = isPressed;
    return isPressed && !wasPressed;
  }

  isGamepadUpPressed() {
    return this.pad ? this.pad.buttons[12].pressed : false;
  }

  isGamepadDownPressed() {
    return this.pad ? this.pad.buttons[13].pressed : false;
  }

  isGamepadLeftPressed() {
    return this.pad ? this.pad.buttons[14].pressed : false;
  }

  isGamepadRightPressed() {
    return this.pad ? this.pad.buttons[15].pressed : false;
  }

  isGamepadConfirmPressed() {
    const interactButton = this.controls?.gamepad?.interactButton ?? 0;
    return this.pad ? this.pad.buttons[interactButton].pressed : false;
  }

  adjustVolume(change) {
    const currentVolume = this.registry.get('sfxVolume') ?? 0.7;
    const nextVolume = Phaser.Math.Clamp(currentVolume + change, 0, 1);
    this.registry.set('sfxVolume', nextVolume);
    this.sound.volume = nextVolume;
    this.refreshMenu();
  }

  confirmSelection() {
    if (this.selectedOption === 0) {
      this.resumeGame();
      return;
    }

    if (this.selectedOption === 1) {
      this.registry.set('pauseInputLockUntil', this.time.now + 700);
      const sectorIndex = Number(this.registry.get('sectorIndex')) || 1;
      this.scene.stop('PauseScene');
      if (this.scene.isActive('GameScene') || this.scene.isPaused('GameScene')) {
        this.scene.stop('GameScene');
      }
      this.scene.start('GameScene', {
        sectorIndex,
        carryResources: false
      });
      return;
    }

    this.adjustVolume(0.1);
  }

  refreshMenu() {
    const sfxVolume = this.registry.get('sfxVolume') ?? 0.7;

    this.optionTexts.forEach((textObject, index) => {
      let label = this.options[index];
      if (index === 2) {
        label = `${label}: ${Math.round(sfxVolume * 100)}%`;
      }

      const selected = index === this.selectedOption;
      textObject.setText(`${selected ? '▶ ' : ''}${label}`);
      textObject.setColor(selected ? '#ffb8d6' : '#e7f2eb');
    });
  }

  resumeGame() {
    this.registry.set('pauseInputLockUntil', this.time.now + 700);
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
