import Phaser from 'phaser';

export class SectorCompleteScene extends Phaser.Scene {
  constructor() {
    super('SectorCompleteScene');
    this.nextSectorIndex = 2;
    this.carriedResources = null;
    this.carriedWeaponId = null;
    this.carriedWaveLevel = null;
    this.confirmLockedUntil = 0;
  }

  create(data = {}) {
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

    this.add.text(width / 2, height * 0.63, 'Press Enter / A to continue', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffb8d6'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.71, 'Press Esc / B for main menu', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#e7f2eb'
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
    if (this.time.now < this.confirmLockedUntil) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.back) || this.isGamepadButtonPressed(1)) {
      this.scene.start('StartScene');
      return;
    }

    const keyboardConfirm = Phaser.Input.Keyboard.JustDown(this.keys.confirm) || Phaser.Input.Keyboard.JustDown(this.keys.altConfirm);
    const gamepadConfirm = this.isGamepadButtonPressed(0);

    if (keyboardConfirm || gamepadConfirm) {
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

    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return false;
    }

    const pads = navigator.getGamepads();
    for (let index = 0; index < pads.length; index += 1) {
      const browserPad = pads[index];
      if (browserPad && browserPad.buttons && browserPad.buttons.length > buttonIndex && browserPad.buttons[buttonIndex].pressed) {
        return true;
      }
    }

    return false;
  }
}
