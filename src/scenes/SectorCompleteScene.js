import Phaser from 'phaser';

const GAMEPAD_CONFIRM_BUTTON = 0;

export class SectorCompleteScene extends Phaser.Scene {
  constructor() {
    super('SectorCompleteScene');
    this.nextSectorIndex = 2;
    this.carriedResources = null;
    this.carriedWeaponId = null;
    this.carriedWaveLevel = null;
    this.confirmLockedUntil = 0;
    this.previousGamepadButtons = {};
    this.transitionQueued = false;
  }

  create(data = {}) {
    this.transitionQueued = false;
    this.previousGamepadButtons = {};

    this.nextSectorIndex = Number(data?.nextSectorIndex) > 0 ? Number(data.nextSectorIndex) : 2;
    this.carriedResources = data?.carriedResources ?? null;
    this.carriedWeaponId = data?.carriedWeaponId ?? null;
    this.carriedWaveLevel = data?.carriedWaveLevel ?? null;

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050d08);

    // Central content panel — matches HUD aesthetic
    this.add.rectangle(width / 2, height * 0.53, 460, 280, 0x0a1210, 0.88)
      .setOrigin(0.5).setStrokeStyle(1, 0x3dff8a, 0.28);

    this.add.text(width / 2, height * 0.34, `SECTOR ${this.nextSectorIndex - 1} CLEARED`, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#5aff9a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.49, `ENTERING SECTOR ${this.nextSectorIndex}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#c0d8cc'
    }).setOrigin(0.5);

    // Continue prompt styled as a terminal confirm button
    this.add.rectangle(width / 2, height * 0.65, 256, 44, 0x0d201a)
      .setOrigin(0.5).setStrokeStyle(1, 0x3dff8a, 0.55);
    this.continueButton = this.add.text(width / 2, height * 0.65, '[A]  CONTINUE', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#5aff9a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (this.input.gamepad) {
      this.input.gamepad.once('connected', (pad) => {
        this.pad = pad;
      });
      if (this.input.gamepad.total > 0) {
        this.pad = this.input.gamepad.getPad(0);
      }
    }

    this.confirmLockedUntil = this.time.now + 180;
  }

  update() {
    if (this.transitionQueued) {
      return;
    }

    if (this.time.now < this.confirmLockedUntil) {
      return;
    }

    const gamepadConfirm = this.isGamepadButtonJustPressed(GAMEPAD_CONFIRM_BUTTON);

    if (!gamepadConfirm) {
      return;
    }

    this.advanceToNextSector();
  }

  advanceToNextSector() {
    if (this.transitionQueued) {
      return;
    }

    this.transitionQueued = true;
    this.registry.set('sectorIndex', this.nextSectorIndex);
    this.scene.start('GameScene', {
      sectorIndex: this.nextSectorIndex,
      carryResources: true,
      carriedResources: this.carriedResources,
      carriedWeaponId: this.carriedWeaponId,
      carriedWaveLevel: this.carriedWaveLevel
    });
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
}
