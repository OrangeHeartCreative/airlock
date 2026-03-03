import Phaser from 'phaser';
import {
  clearCustomBindings,
  clearCustomGamepadBindings,
  GAMEPAD_ACTIONS,
  getControlConfig,
  getControlPresetName,
  getControlPresetOptions,
  hasCustomBindings,
  setCustomGamepadBinding
} from '../config/controls.js';

const MENU_STICK_DEADZONE = 0.5;

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
    this.menuMode = 'main';
    this.mainSelection = 0;
    this.settingsSelection = 0;
    this.remapSelection = 0;
    this.mainOptions = ['Start Run', 'Settings'];
    this.settingsOptions = ['SFX Volume', 'Control Preset', 'Remap Gamepad', 'Reset Custom Binds', 'Back'];
    this.controlPresetOptions = [];
    this.awaitingBinding = null;
    this.awaitingBindReadyAt = 0;
    this.nextMenuInputAt = 0;
    this.pendingRestoreMode = null;
    this.onGamepadDisconnected = null;
    this.detectedGamepadName = null;
    this.previousGamepadButtons = {};
    this.confirmInputArmed = false;
    this.mainMenuMessage = '';
    this.mainMenuMessageExpiresAt = 0;
  }

  create() {
    this.menuMode = 'main';
    this.mainSelection = 0;
    this.settingsSelection = 0;
    this.remapSelection = 0;
    this.awaitingBinding = null;
    this.pendingRestoreMode = null;
    this.previousGamepadButtons = {};
    this.confirmInputArmed = false;
    this.mainMenuMessage = '';
    this.mainMenuMessageExpiresAt = 0;
    this.nextMenuInputAt = this.time.now + 220;

    this.initializeSettings();
    this.controlPresetOptions = getControlPresetOptions();

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050b08);
    this.titleText = this.add.text(width / 2, height * 0.28, 'AIRLOCK', {
      fontFamily: 'Arial',
      fontSize: '68px',
      color: '#d4f5c6'
    }).setOrigin(0.5);

    this.gamepadStatusText = this.add.text(width / 2, height * 0.8, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#a9d7ff',
      align: 'center'
    }).setOrigin(0.5);

    const menuLineCount = Math.max(this.mainOptions.length, this.settingsOptions.length, GAMEPAD_ACTIONS.length + 1);
    this.menuTexts = Array.from({ length: menuLineCount }, (_, index) => {
      return this.add.text(width / 2, height * 0.5 + index * 52, '', {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: '#e7f2eb'
      }).setOrigin(0.5);
    });

    this.helpText = this.add.text(width / 2, height * 0.87, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffbbd5'
    }).setOrigin(0.5);

    this.input.on('pointerdown', this.onPointerDown, this);

    if (this.input.gamepad) {
      this.input.gamepad.once('connected', (pad) => {
        this.pad = pad;
        this.detectedGamepadName = pad.id || this.detectedGamepadName;
        this.refreshView();
      });

      this.onGamepadDisconnected = (pad) => {
        if (this.pad && pad && this.pad.index === pad.index) {
          this.pad = null;
          this.refreshView();
        }
      };
      this.input.gamepad.on('disconnected', this.onGamepadDisconnected);

      if (this.input.gamepad.total > 0) {
        this.pad = this.input.gamepad.getPad(0);
        this.detectedGamepadName = this.pad?.id || this.detectedGamepadName;
      }
    }

    this.events.on('shutdown', () => {
      this.input.off('pointerdown', this.onPointerDown, this);
      if (this.input.gamepad && this.onGamepadDisconnected) {
        this.input.gamepad.off('disconnected', this.onGamepadDisconnected);
      }
    });

    this.refreshView();
  }

  initializeSettings() {
    if (!this.registry.has('sfxVolume')) {
      this.registry.set('sfxVolume', 0.7);
    }

    if (!this.registry.has('controlPreset')) {
      this.registry.set('controlPreset', 'default');
    }

    if (!this.registry.has('customGamepadBinds')) {
      this.registry.set('customGamepadBinds', {});
    }

    this.sound.volume = this.registry.get('sfxVolume');
  }

  update() {
    if (this.mainMenuMessage && this.time.now >= this.mainMenuMessageExpiresAt) {
      this.mainMenuMessage = '';
      this.mainMenuMessageExpiresAt = 0;
      this.refreshView();
    }

    this.refreshGamepadConnectionState();
    this.updateConfirmInputArmState();

    if (this.tryCaptureGamepadBinding()) {
      return;
    }

    const backPressed = this.confirmInputArmed && this.isGamepadBackPressed();
    if (backPressed) {
      this.handleBackAction();
      return;
    }

    if (this.awaitingBinding) {
      return;
    }

    if (this.consumeMenuInput(this.isGamepadUpPressed())) {
      this.moveSelection(-1);
    }

    if (this.consumeMenuInput(this.isGamepadDownPressed())) {
      this.moveSelection(1);
    }

    if (this.consumeMenuInput(this.isGamepadLeftPressed())) {
      this.adjustCurrentSetting(-1);
    }

    if (this.consumeMenuInput(this.isGamepadRightPressed())) {
      this.adjustCurrentSetting(1);
    }

    const gamepadConfirm = this.confirmInputArmed && this.isGamepadConfirmPressed();
    if (this.consumeMenuInput(gamepadConfirm)) {
      this.confirmSelection();
    }
  }

  updateConfirmInputArmState() {
    if (this.confirmInputArmed) {
      return;
    }

    if (this.isAnyConfirmInputHeld()) {
      this.syncConfirmButtonStates();
      return;
    }

    this.confirmInputArmed = true;
    this.syncConfirmButtonStates();
  }

  isAnyConfirmInputHeld() {
    const pointerConfirmHeld = this.input?.activePointer?.isDown === true;
    const controls = getControlConfig(this.registry);
    const interactButton = controls?.gamepad?.interactButton ?? 0;
    const gamepadConfirmHeld = this.isGamepadButtonPressed(interactButton);
    const gamepadBackHeld = this.isGamepadButtonPressed(1);

    return pointerConfirmHeld || gamepadConfirmHeld || gamepadBackHeld;
  }

  syncConfirmButtonStates() {
    const controls = getControlConfig(this.registry);
    const interactButton = controls?.gamepad?.interactButton ?? 0;
    this.previousGamepadButtons[interactButton] = this.isGamepadButtonPressed(interactButton);
    this.previousGamepadButtons[1] = this.isGamepadButtonPressed(1);
  }

  consumeMenuInput(isRequested) {
    if (!isRequested) {
      return false;
    }

    if (this.time.now < this.nextMenuInputAt) {
      return false;
    }

    this.nextMenuInputAt = this.time.now + 160;
    return true;
  }

  isGamepadUpPressed() {
    return this.getGamepadAxisValue(1) >= MENU_STICK_DEADZONE;
  }

  isGamepadDownPressed() {
    return this.getGamepadAxisValue(1) <= -MENU_STICK_DEADZONE;
  }

  isGamepadLeftPressed() {
    return this.getGamepadAxisValue(0) <= -MENU_STICK_DEADZONE;
  }

  isGamepadRightPressed() {
    return this.getGamepadAxisValue(0) >= MENU_STICK_DEADZONE;
  }

  isGamepadConfirmPressed() {
    const controls = getControlConfig(this.registry);
    const interactButton = controls?.gamepad?.interactButton ?? 0;
    return this.isGamepadButtonJustPressed(interactButton);
  }

  isGamepadBackPressed() {
    return this.isGamepadButtonJustPressed(1);
  }

  isGamepadButtonPressed(buttonIndex) {
    if (this.pad && this.pad.buttons.length > buttonIndex) {
      return this.pad.buttons[buttonIndex].pressed;
    }

    const browserPad = this.getBrowserConnectedGamepad();
    if (!browserPad || !browserPad.buttons || browserPad.buttons.length <= buttonIndex) {
      return false;
    }

    return !!browserPad.buttons[buttonIndex].pressed;
  }

  isGamepadButtonJustPressed(buttonIndex) {
    const pressedNow = this.isGamepadButtonPressed(buttonIndex);
    const wasPressed = this.previousGamepadButtons[buttonIndex] === true;
    this.previousGamepadButtons[buttonIndex] = pressedNow;
    return pressedNow && !wasPressed;
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

    const browserPad = this.getBrowserConnectedGamepad();
    if (!browserPad || !browserPad.axes || browserPad.axes.length <= axisIndex) {
      return 0;
    }

    return Number(browserPad.axes[axisIndex]) || 0;
  }

  getBrowserConnectedGamepad() {
    const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
    if (!browserNavigator || !browserNavigator.getGamepads) {
      return null;
    }

    const pads = browserNavigator.getGamepads();
    for (let index = 0; index < pads.length; index += 1) {
      if (pads[index]) {
        return pads[index];
      }
    }

    return null;
  }

  refreshGamepadConnectionState() {
    const browserPad = this.getBrowserConnectedGamepad();
    if (browserPad && !this.detectedGamepadName) {
      this.detectedGamepadName = browserPad.id || 'Gamepad';
      this.refreshView();
    }

    if (!browserPad && !this.pad && this.detectedGamepadName) {
      this.detectedGamepadName = null;
      this.refreshView();
    }
  }

  onPointerDown() {
    if (this.awaitingBinding) {
      return;
    }

    if (!this.confirmInputArmed) {
      return;
    }

    if (!this.consumeMenuInput(true)) {
      return;
    }

    this.confirmSelection();
  }

  moveSelection(direction) {
    this.pendingRestoreMode = null;

    if (this.menuMode === 'main') {
      this.mainSelection = Phaser.Math.Wrap(this.mainSelection + direction, 0, this.mainOptions.length);
    } else if (this.menuMode === 'settings') {
      this.settingsSelection = Phaser.Math.Wrap(this.settingsSelection + direction, 0, this.settingsOptions.length);
    } else {
      this.remapSelection = Phaser.Math.Wrap(this.remapSelection + direction, 0, GAMEPAD_ACTIONS.length + 1);
    }
    this.refreshView();
  }

  confirmSelection() {
    if (this.menuMode === 'main') {
      if (this.mainSelection === 0) {
        this.startGame();
      } else {
        this.menuMode = 'settings';
        this.settingsSelection = 0;
        this.refreshView();
      }
      return;
    }

    if (this.menuMode === 'settings') {
      this.confirmSettingsSelection();
      return;
    }

    this.beginBindingCapture();
  }

  confirmSettingsSelection() {
    if (this.settingsSelection === 0) {
      this.adjustVolume(0.1);
      return;
    }

    if (this.settingsSelection === 1) {
      this.cycleControlPreset(1);
      return;
    }

    if (this.settingsSelection === 2) {
      this.menuMode = 'remapGamepad';
      this.remapSelection = 0;
      this.refreshView();
      return;
    }

    if (this.settingsSelection === 3) {
      clearCustomBindings(this.registry);
      this.refreshView();
      return;
    }

    this.menuMode = 'main';
    this.mainSelection = 0;
    this.refreshView();
  }

  handleBackAction() {
    if (this.pendingRestoreMode) {
      this.pendingRestoreMode = null;
      this.refreshView();
      return;
    }

    if (this.awaitingBinding) {
      this.awaitingBinding = null;
      this.refreshView();
      return;
    }

    if (this.menuMode === 'remapGamepad') {
      this.menuMode = 'settings';
      this.settingsSelection = 0;
      this.refreshView();
      return;
    }

    if (this.menuMode === 'settings') {
      this.menuMode = 'main';
      this.mainSelection = 0;
      this.refreshView();
    }
  }

  adjustCurrentSetting(direction) {
    if (this.menuMode !== 'settings') {
      return;
    }

    if (this.settingsSelection === 0) {
      this.adjustVolume(direction * 0.1);
      return;
    }

    if (this.settingsSelection === 1) {
      this.cycleControlPreset(direction);
    }
  }

  adjustVolume(change) {
    const currentVolume = this.registry.get('sfxVolume') ?? 0.7;
    const nextVolume = Phaser.Math.Clamp(currentVolume + change, 0, 1);
    this.registry.set('sfxVolume', nextVolume);
    this.sound.volume = nextVolume;
    this.refreshView();
  }

  cycleControlPreset(direction) {
    const currentPreset = getControlPresetName(this.registry);
    const currentIndex = this.controlPresetOptions.findIndex((option) => option.value === currentPreset);
    const nextIndex = Phaser.Math.Wrap(currentIndex + direction, 0, this.controlPresetOptions.length);
    const nextPreset = this.controlPresetOptions[nextIndex];
    this.registry.set('controlPreset', nextPreset.value);
    this.refreshView();
  }

  beginBindingCapture() {
    const actionList = GAMEPAD_ACTIONS;

    if (this.remapSelection === actionList.length) {
      if (this.pendingRestoreMode !== this.menuMode) {
        this.pendingRestoreMode = this.menuMode;
        this.refreshView();
        return;
      }

      clearCustomGamepadBindings(this.registry);

      this.pendingRestoreMode = null;
      this.refreshView();
      return;
    }

    this.pendingRestoreMode = null;

    const selectedAction = actionList[this.remapSelection];
    if (!selectedAction) {
      return;
    }

    this.awaitingBinding = {
      type: 'gamepad',
      action: selectedAction.value
    };
    this.awaitingBindReadyAt = this.time.now + 180;
    this.refreshView();
  }

  tryCaptureGamepadBinding() {
    if (!this.awaitingBinding || this.awaitingBinding.type !== 'gamepad') {
      return false;
    }

    if (this.time.now < this.awaitingBindReadyAt) {
      return true;
    }

    const buttonCount = this.pad?.buttons?.length ?? this.getBrowserConnectedGamepad()?.buttons?.length ?? 0;
    for (let index = 0; index < buttonCount; index += 1) {
      if (this.isGamepadButtonPressed(index)) {
        setCustomGamepadBinding(this.registry, this.awaitingBinding.action, index);
        this.awaitingBinding = null;
        this.refreshView();
        return true;
      }
    }

    return true;
  }

  getGamepadActionDisplay(actionValue, gamepadConfig) {
    return String(gamepadConfig[actionValue]);
  }

  refreshView() {
    const currentPresetName = getControlPresetName(this.registry);
    const currentPresetLabel = this.controlPresetOptions.find((option) => option.value === currentPresetName)?.label ?? 'Default';
    const customActive = hasCustomBindings(this.registry);

    const controlConfig = getControlConfig(this.registry);
    const browserPad = this.getBrowserConnectedGamepad();
    const connectedGamepadName = this.pad?.id || this.detectedGamepadName || browserPad?.id || null;
    const gamepadStatus = connectedGamepadName
      ? `Gamepad: Connected${connectedGamepadName ? ` (${connectedGamepadName})` : ''}`
      : 'Gamepad: Not Connected';
    this.gamepadStatusText.setText(gamepadStatus);
    this.gamepadStatusText.setVisible(this.menuMode === 'main');

    this.menuTexts.forEach((menuText) => menuText.setVisible(false));

    if (this.menuMode === 'main') {
      this.mainOptions.forEach((option, index) => {
        const selected = index === this.mainSelection;
        this.menuTexts[index].setVisible(true);
        this.menuTexts[index].setText(`${selected ? '▶ ' : ''}${option}`);
        this.menuTexts[index].setColor(selected ? '#ffb8d6' : '#e7f2eb');
      });

      this.helpText.setText(this.mainMenuMessage || '');
      return;
    }

    if (this.menuMode === 'settings') {
      const sfxVolume = this.registry.get('sfxVolume') ?? 0.7;
      const settingLines = [
        `SFX Volume: ${Math.round(sfxVolume * 100)}%`,
        `Control Preset: ${currentPresetLabel}`,
        'Remap Gamepad',
        `Reset Custom Binds (${customActive ? 'ON' : 'OFF'})`,
        'Back'
      ];

      settingLines.forEach((line, index) => {
        const selected = index === this.settingsSelection;
        this.menuTexts[index].setVisible(true);
        this.menuTexts[index].setText(`${selected ? '▶ ' : ''}${line}`);
        this.menuTexts[index].setColor(selected ? '#ffb8d6' : '#e7f2eb');
      });

      this.helpText.setText('');
      return;
    }

    const actionList = GAMEPAD_ACTIONS;
    actionList.forEach((action, index) => {
      const selected = index === this.remapSelection;
      const binding = this.getGamepadActionDisplay(action.value, controlConfig.gamepad);

      const awaitingThisAction = this.awaitingBinding && this.awaitingBinding.action === action.value;
      const bindSuffix = awaitingThisAction ? '  [Press input...]' : '';

      this.menuTexts[index].setVisible(true);
      this.menuTexts[index].setText(`${selected ? '▶ ' : ''}${action.label}: ${binding}${bindSuffix}`);
      this.menuTexts[index].setColor(selected ? '#ffb8d6' : '#e7f2eb');
    });

    const restoreIndex = actionList.length;
    const restoreSelected = restoreIndex === this.remapSelection;
    const restorePending = this.pendingRestoreMode === this.menuMode;
    this.menuTexts[restoreIndex].setVisible(true);
    this.menuTexts[restoreIndex].setText(`${restoreSelected ? '▶ ' : ''}Restore Defaults${restorePending ? '  [Press Confirm Again]' : ''}`);
    this.menuTexts[restoreIndex].setColor(restoreSelected ? '#ffb8d6' : '#e7f2eb');

    if (restorePending) {
      this.helpText.setText('Confirm again to restore all for this device  •  B Cancel');
      return;
    }

    this.helpText.setText('A Bind  •  Left Stick ↑/↓ Navigate  •  B Back/Cancel');
  }

  startGame() {
    this.startGameAtSector(1);
  }

  setMainMenuMessage(message, durationMs = 2600) {
    this.mainMenuMessage = message;
    this.mainMenuMessageExpiresAt = this.time.now + durationMs;
    this.refreshView();
  }

  startGameAtSector(sectorIndex) {
    const normalizedSector = Math.max(1, Math.round(Number(sectorIndex) || 1));

    if (!this.scene.isActive('GameScene')) {
      this.registry.set('sectorIndex', normalizedSector);
      this.scene.start('GameScene', {
        sectorIndex: normalizedSector,
        carryResources: false
      });
    }
  }
}
