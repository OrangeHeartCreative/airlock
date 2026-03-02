import Phaser from 'phaser';
import { getControlConfig } from '../config/controls.js';

const PAUSE_BUTTON_ARMED_KEY = 'pauseButtonArmed';
const MENU_STICK_DEADZONE = 0.5;

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
    this.selectedOption = 0;
    this.options = ['Resume', 'Restart Sector', 'SFX Volume'];
    this.pauseInputLockUntil = 0;
    this.previousGamepadButtons = {};
    this.transitionQueued = false;
    this.previousStickDirections = {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  create() {
    this.transitionQueued = false;
    this.previousGamepadButtons = {};
    this.previousStickDirections = {
      up: false,
      down: false,
      left: false,
      right: false
    };

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

    this.helpText = this.add.text(width / 2, height * 0.82, '', {
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
    const currentStickDirections = this.getCurrentStickDirections();

    if (Phaser.Input.Keyboard.JustDown(this.keys.resume) || this.isGamepadPauseJustPressed()) {
      this.previousStickDirections = currentStickDirections;
      this.resumeGame();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.up) || this.isStickDirectionJustPressed('up', currentStickDirections)) {
      this.selectedOption = Phaser.Math.Wrap(this.selectedOption - 1, 0, this.options.length);
      this.refreshMenu();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.down) || this.isStickDirectionJustPressed('down', currentStickDirections)) {
      this.selectedOption = Phaser.Math.Wrap(this.selectedOption + 1, 0, this.options.length);
      this.refreshMenu();
    }

    if (this.selectedOption === 2 && (Phaser.Input.Keyboard.JustDown(this.keys.left) || this.isStickDirectionJustPressed('left', currentStickDirections))) {
      this.adjustVolume(-0.1);
    }

    if (this.selectedOption === 2 && (Phaser.Input.Keyboard.JustDown(this.keys.right) || this.isStickDirectionJustPressed('right', currentStickDirections))) {
      this.adjustVolume(0.1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm) || this.isGamepadConfirmJustPressed()) {
      this.confirmSelection();
    }

    this.previousStickDirections = currentStickDirections;
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

  isGamepadConfirmJustPressed() {
    const interactButton = this.controls?.gamepad?.interactButton ?? 0;
    return this.isGamepadButtonJustPressed(interactButton);
  }

  getCurrentStickDirections() {
    const axisX = this.getGamepadAxisValue(0);
    const axisY = this.getGamepadAxisValue(1);

    return {
      up: axisY >= MENU_STICK_DEADZONE,
      down: axisY <= -MENU_STICK_DEADZONE,
      left: axisX <= -MENU_STICK_DEADZONE,
      right: axisX >= MENU_STICK_DEADZONE
    };
  }

  isStickDirectionJustPressed(direction, currentState) {
    const wasPressed = this.previousStickDirections[direction] === true;
    const pressedNow = currentState[direction] === true;
    return pressedNow && !wasPressed;
  }

  getGamepadAxisValue(axisIndex) {
    if (this.pad && this.pad.axes && this.pad.axes.length > axisIndex) {
      const axis = this.pad.axes[axisIndex];
      if (typeof axis === 'number') {
        return axis;
      }
      if (axis && typeof axis.getValue === 'function') {
        return axis.getValue();
      }
    }

    const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
    if (!browserNavigator || !browserNavigator.getGamepads) {
      return 0;
    }

    const pads = browserNavigator.getGamepads();
    for (let index = 0; index < pads.length; index += 1) {
      const browserPad = pads[index];
      if (browserPad && browserPad.axes && browserPad.axes.length > axisIndex) {
        return Number(browserPad.axes[axisIndex]) || 0;
      }
    }

    return 0;
  }

  adjustVolume(change) {
    const currentVolume = this.registry.get('sfxVolume') ?? 0.7;
    const nextVolume = Phaser.Math.Clamp(currentVolume + change, 0, 1);
    this.registry.set('sfxVolume', nextVolume);
    this.sound.volume = nextVolume;
    this.refreshMenu();
  }

  confirmSelection() {
    if (this.transitionQueued) {
      return;
    }

    if (this.selectedOption === 0) {
      this.resumeGame();
      return;
    }

    if (this.selectedOption === 1) {
      this.transitionQueued = true;
      this.registry.set('pauseInputLockUntil', this.time.now + 700);
      this.registry.set('contactDamageLockUntil', this.time.now + 450);
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
    if (this.transitionQueued) {
      return;
    }

    this.transitionQueued = true;
    this.registry.set('pauseInputLockUntil', this.time.now + 700);
    this.registry.set('contactDamageLockUntil', this.time.now + 450);
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
