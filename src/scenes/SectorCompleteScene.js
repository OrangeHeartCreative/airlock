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

    this.add.text(width / 2, height * 0.34, `SECTOR ${this.nextSectorIndex - 1} CLEARED`, {
      fontFamily: 'Arial',
      fontSize: '58px',
      color: '#d6f7cb'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, `Next Sector: ${this.nextSectorIndex}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#a9d7ff'
    }).setOrigin(0.5);

    this.keys = this.input.keyboard.addKeys({
      confirm: 'ENTER',
      altConfirm: 'SPACE',
      back: 'ESC'
    });

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

    if (Phaser.Input.Keyboard.JustDown(this.keys.back) || this.isGamepadButtonJustPressed(1)) {
      this.transitionQueued = true;
      this.scene.start('StartScene');
      return;
    }

    const keyboardConfirm = Phaser.Input.Keyboard.JustDown(this.keys.confirm) || Phaser.Input.Keyboard.JustDown(this.keys.altConfirm);
    const gamepadConfirm = this.isGamepadButtonJustPressed(GAMEPAD_CONFIRM_BUTTON);

    if (keyboardConfirm || gamepadConfirm) {
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
