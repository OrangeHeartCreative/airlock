import Phaser from 'phaser';

const GAMEPAD_CONFIRM_BUTTON = 0;
const GAMEPAD_MENU_UP_BUTTON = 12;
const GAMEPAD_MENU_DOWN_BUTTON = 13;
const MENU_STICK_DEADZONE = 0.5;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.transitionQueued = false;
    this.previousGamepadButtons = {};
    this.previousStickDirections = { up: false, down: false };
    this.menuSelection = 0;
    this.menuOptions = [];
  }

  create() {
    this.transitionQueued = false;
    this.previousGamepadButtons = {};
    this.previousStickDirections = { up: false, down: false };
    this.menuSelection = 0;
    this.menuOptions = [];

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

    this.menuOptions = [
      this.createMenuOption(width / 2, height * 0.6, 'Restart', () => this.restartRun()),
      this.createMenuOption(width / 2, height * 0.72, 'Main Menu', () => this.returnToMainMenu())
    ];

    this.add.text(width / 2, height * 0.84, 'Left Stick ↑/↓: Select  •  A: Confirm', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#d4f5c6'
    }).setOrigin(0.5);

    this.refreshMenuSelection();
  }

  update() {
    if (this.transitionQueued) {
      return;
    }

    const stickDirections = this.getCurrentStickDirections();
    const stickUpPressed = this.isStickDirectionJustPressed('up', stickDirections);
    const stickDownPressed = this.isStickDirectionJustPressed('down', stickDirections);

    const moveUp = this.isGamepadButtonJustPressed(GAMEPAD_MENU_UP_BUTTON)
      || stickUpPressed;
    if (moveUp) {
      this.menuSelection = Phaser.Math.Wrap(this.menuSelection - 1, 0, this.menuOptions.length);
      this.refreshMenuSelection();
    }

    const moveDown = this.isGamepadButtonJustPressed(GAMEPAD_MENU_DOWN_BUTTON)
      || stickDownPressed;
    if (moveDown) {
      this.menuSelection = Phaser.Math.Wrap(this.menuSelection + 1, 0, this.menuOptions.length);
      this.refreshMenuSelection();
    }

    const gamepadConfirm = this.isGamepadButtonJustPressed(GAMEPAD_CONFIRM_BUTTON);

    if (gamepadConfirm) {
      this.activateCurrentSelection();
    }

    this.previousStickDirections = stickDirections;
  }

  getCurrentStickDirections() {
    const verticalAxis = this.getGamepadAxisValue(1);
    return {
      up: verticalAxis >= MENU_STICK_DEADZONE,
      down: verticalAxis <= -MENU_STICK_DEADZONE
    };
  }

  isStickDirectionJustPressed(direction, currentDirections) {
    const wasPressed = this.previousStickDirections[direction] === true;
    return currentDirections[direction] === true && !wasPressed;
  }

  createMenuOption(x, y, label, action) {
    const button = this.add
      .rectangle(x, y, 280, 68, 0x2f4a3f)
      .setStrokeStyle(2, 0xd4f5c6)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#d4f5c6'
    }).setOrigin(0.5);

    const option = { button, text, action };

    button.on('pointerover', () => {
      const hoveredIndex = this.menuOptions.indexOf(option);
      if (hoveredIndex >= 0 && hoveredIndex !== this.menuSelection) {
        this.menuSelection = hoveredIndex;
        this.refreshMenuSelection();
      }
    });

    button.on('pointerdown', () => {
      if (this.transitionQueued) {
        return;
      }

      const selectedIndex = this.menuOptions.indexOf(option);
      if (selectedIndex >= 0) {
        this.menuSelection = selectedIndex;
        this.refreshMenuSelection();
      }
      this.activateCurrentSelection();
    });

    return option;
  }

  refreshMenuSelection() {
    this.menuOptions.forEach((option, index) => {
      const selected = index === this.menuSelection;
      option.button.setFillStyle(selected ? 0x3b5a4c : 0x2f4a3f);
      option.text.setColor(selected ? '#f0ffd7' : '#d4f5c6');
    });
  }

  activateCurrentSelection() {
    const selectedOption = this.menuOptions[this.menuSelection];
    if (selectedOption && typeof selectedOption.action === 'function') {
      selectedOption.action();
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

  getGamepadAxisValue(axisIndex) {
    if (this.pad && this.pad.axes.length > axisIndex) {
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

  returnToMainMenu() {
    if (this.transitionQueued) {
      return;
    }

    this.transitionQueued = true;
    this.scene.start('StartScene');
  }
}