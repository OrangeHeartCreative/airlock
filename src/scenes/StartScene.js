import Phaser from 'phaser';
import {
  clearCustomGamepadBindings,
  GAMEPAD_ACTIONS,
  getControlConfig,
  getControlPresetName,
  getControlPresetOptions,
  hasCustomBindings,
  setCustomGamepadBinding
} from '../config/controls.js';
import { buildUISounds } from '../assets/SoundFactory.js';
import { startAmbientMusic } from '../assets/MusicFactory.js';

const MENU_STICK_DEADZONE = 0.5;
const INPUT_ARM_TIMEOUT_MS = 700;
const PAUSE_BUTTON_ARMED_KEY = 'pauseButtonArmed';

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
    this.previousGamepadButtons = new Map();
    this.inputArmed = false;
    this.inputArmDeadlineAt = 0;
    this.prevConfirmPressed = false;
    this.prevBackPressed = false;
    this.mainMenuMessage = '';
    this.mainMenuMessageExpiresAt = 0;
  }

  create(data = {}) {
    if (this.input) {
      this.input.enabled = true;
      if (this.input.manager) {
        this.input.manager.enabled = true;
      }
    }

    this.menuMode = 'main';
    this.mainSelection = 0;
    this.settingsSelection = 0;
    this.remapSelection = 0;
    this.awaitingBinding = null;
    this.pendingRestoreMode = null;
    this.previousGamepadButtons = new Map();
    this.inputArmed = false;
    this.inputArmDeadlineAt = this.time.now + INPUT_ARM_TIMEOUT_MS;
    this.prevConfirmPressed = false;
    this.prevBackPressed = false;
    this.mainMenuMessage = '';
    this.mainMenuMessageExpiresAt = 0;
    this.nextMenuInputAt = 0;

    this.initializeSettings();
    this.controlPresetOptions = getControlPresetOptions();

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050b08);
    this.add.rectangle(width / 2, height * 0.22, 460, 96, 0x1a5c30).setOrigin(0.5);
    this.titleText = this.add.text(width / 2, height * 0.22, 'AIRLOCK', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#e8f5ee',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.34, 'THE ONCOMING SWARM', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#26aa55',
      letterSpacing: 9
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 18, 'An Orange Heart Creative Production', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#2a3830'
    }).setOrigin(0.5);

    this.gamepadStatusText = this.add.text(width / 2, height * 0.81, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#6a8a7a',
      align: 'center'
    }).setOrigin(0.5);

    const menuLineCount = Math.max(this.mainOptions.length, this.settingsOptions.length, GAMEPAD_ACTIONS.length + 1);
    this.menuTexts = Array.from({ length: menuLineCount }, (_, index) => {
      return this.add.text(width / 2, height * 0.44 + index * 38, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#c0d8cc'
      }).setOrigin(0.5);
    });

    this.helpText = this.add.text(width / 2, height * 0.87, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#88aa88'
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
    this.sound.volume = this.registry.get('sfxVolume') ?? 0.7;
    buildUISounds(this);
    startAmbientMusic(this);
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
    this.clearExpiredMainMenuMessage();
    this.refreshGamepadConnectionState();

    if (this.tryCaptureGamepadBinding()) {
      this.prevConfirmPressed = this.isGamepadConfirmPressed();
      this.prevBackPressed = this.isGamepadBackPressed();
      return;
    }

    const confirmPressed = this.isGamepadConfirmPressed();
    const backPressed = this.isGamepadBackPressed();

    if (!this.inputArmed) {
      if (!confirmPressed && !backPressed) {
        this.inputArmed = true;
      }

      if (this.time.now >= this.inputArmDeadlineAt) {
        this.inputArmed = true;
      }

      this.prevConfirmPressed = confirmPressed;
      this.prevBackPressed = backPressed;
      return;
    }

    if (this.menuMode !== 'main' && backPressed && !this.prevBackPressed) {
      this.prevConfirmPressed = confirmPressed;
      this.prevBackPressed = backPressed;
      this.handleBackAction();
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

    if (confirmPressed && !this.prevConfirmPressed) {
      this.confirmSelection();
    }

    this.prevConfirmPressed = confirmPressed;
    this.prevBackPressed = backPressed;
  }

  clearExpiredMainMenuMessage() {
    if (!this.mainMenuMessage || this.time.now < this.mainMenuMessageExpiresAt) {
      return;
    }

    this.mainMenuMessage = '';
    this.mainMenuMessageExpiresAt = 0;
    this.refreshView();
  }

  isAnyGamepadButtonHeld() {
    const buttonCount = this.pad?.buttons?.length ?? this.getBrowserConnectedGamepad()?.buttons?.length ?? 0;
    for (let index = 0; index < buttonCount; index += 1) {
      if (this.isGamepadButtonPressed(index)) {
        return true;
      }
    }

    return false;
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
    return this.getGamepadAxisValue(1) >= MENU_STICK_DEADZONE || this.isGamepadButtonPressed(12);
  }

  isGamepadDownPressed() {
    return this.getGamepadAxisValue(1) <= -MENU_STICK_DEADZONE || this.isGamepadButtonPressed(13);
  }

  isGamepadLeftPressed() {
    return this.getGamepadAxisValue(0) <= -MENU_STICK_DEADZONE || this.isGamepadButtonPressed(14);
  }

  isGamepadRightPressed() {
    return this.getGamepadAxisValue(0) >= MENU_STICK_DEADZONE || this.isGamepadButtonPressed(15);
  }

  getConfirmCandidates() {
    const controls = getControlConfig(this.registry);
    const interactButton = controls?.gamepad?.interactButton ?? 0;
    return [interactButton];
  }

  isGamepadConfirmPressed() {
    return this.isAnyGamepadButtonPressed(this.getConfirmCandidates());
  }

  isGamepadBackPressed() {
    const confirmCandidates = this.getConfirmCandidates();
    const backCandidates = [1, 2, 3, 0].filter((button) => !confirmCandidates.includes(button));
    return this.isAnyGamepadButtonPressed(backCandidates);
  }

  isAnyGamepadButtonPressed(buttonIndices) {
    if (!Array.isArray(buttonIndices) || buttonIndices.length === 0) {
      return false;
    }

    return buttonIndices.some((buttonIndex) => this.isGamepadButtonPressed(buttonIndex));
  }

  isGamepadButtonPressed(buttonIndex) {
    const normalizedButtonIndex = this.normalizeButtonIndex(buttonIndex);
    if (normalizedButtonIndex === null) {
      return false;
    }

    if (this.pad && this.pad.buttons.length > normalizedButtonIndex) {
      const button = this.pad.buttons.at(normalizedButtonIndex);
      return button?.pressed === true;
    }

    const browserPad = this.getBrowserConnectedGamepad();
    if (!browserPad || !browserPad.buttons || browserPad.buttons.length <= normalizedButtonIndex) {
      return false;
    }

    const browserButton = browserPad.buttons.at(normalizedButtonIndex);
    return browserButton?.pressed === true;
  }

  isGamepadButtonJustPressed(buttonIndex) {
    const normalizedButtonIndex = this.normalizeButtonIndex(buttonIndex);
    if (normalizedButtonIndex === null) {
      return false;
    }

    const pressedNow = this.isGamepadButtonPressed(buttonIndex);
    const wasPressed = this.previousGamepadButtons.get(normalizedButtonIndex) === true;
    this.previousGamepadButtons.set(normalizedButtonIndex, pressedNow);
    return pressedNow && !wasPressed;
  }

  normalizeButtonIndex(buttonIndex) {
    if (!Number.isInteger(buttonIndex) || buttonIndex < 0 || buttonIndex > 31) {
      return null;
    }

    return buttonIndex;
  }

  normalizeAxisIndex(axisIndex) {
    if (!Number.isInteger(axisIndex) || axisIndex < 0 || axisIndex > 7) {
      return null;
    }

    return axisIndex;
  }

  getGamepadAxisValue(axisIndex) {
    const normalizedAxisIndex = this.normalizeAxisIndex(axisIndex);
    if (normalizedAxisIndex === null) {
      return 0;
    }

    return (
      this.readAxisValueFromPad(this.pad, normalizedAxisIndex)
      ?? this.readAxisValueFromPad(this.getBrowserConnectedGamepad(), normalizedAxisIndex)
      ?? 0
    );
  }

  readAxisValueFromPad(pad, axisIndex) {
    if (!pad || !pad.axes || pad.axes.length <= axisIndex) {
      return null;
    }

    const axis = pad.axes.at(axisIndex);
    if (typeof axis === 'number') {
      return axis;
    }

    if (axis && typeof axis.getValue === 'function') {
      return axis.getValue();
    }

    return Number(axis) || 0;
  }

  getBrowserConnectedGamepad() {
    const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
    if (!browserNavigator || !browserNavigator.getGamepads) {
      return null;
    }

    const pads = browserNavigator.getGamepads();
    for (const pad of pads) {
      if (pad) {
        return pad;
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
    this.playSound('sfx_ui_navigate');
    this.refreshView();
  }

  confirmSelection() {
    this.playSound('sfx_ui_confirm');
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
      clearCustomGamepadBindings(this.registry);
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
    const nextPreset = this.controlPresetOptions.at(nextIndex);
    if (!nextPreset) {
      return;
    }

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
    this.inputArmed = false;
    this.inputArmDeadlineAt = this.time.now + INPUT_ARM_TIMEOUT_MS;
    this.refreshView();
  }

  tryCaptureGamepadBinding() {
    if (!this.isAwaitingGamepadBindingCapture()) {
      return false;
    }

    if (!this.isBindingCaptureReady()) {
      return true;
    }

    const capturedButtonIndex = this.getFirstPressedGamepadButtonIndex();
    if (capturedButtonIndex !== null) {
      this.completeGamepadBindingCapture(capturedButtonIndex);
    }

    return true;
  }

  isAwaitingGamepadBindingCapture() {
    return this.awaitingBinding?.type === 'gamepad';
  }

  isBindingCaptureReady() {
    return this.time.now >= this.awaitingBindReadyAt;
  }

  getFirstPressedGamepadButtonIndex() {
    const buttonCount = this.pad?.buttons?.length ?? this.getBrowserConnectedGamepad()?.buttons?.length ?? 0;
    for (let index = 0; index < buttonCount; index += 1) {
      if (this.isGamepadButtonPressed(index)) {
        return index;
      }
    }

    return null;
  }

  completeGamepadBindingCapture(buttonIndex) {
    if (!this.awaitingBinding) {
      return;
    }

    setCustomGamepadBinding(this.registry, this.awaitingBinding.action, buttonIndex);
    this.awaitingBinding = null;
    this.inputArmed = false;
    this.inputArmDeadlineAt = this.time.now + INPUT_ARM_TIMEOUT_MS;
    this.nextMenuInputAt = this.time.now + 150;
    this.refreshView();
  }

  getGamepadActionDisplay(actionValue, gamepadConfig) {
    if (!gamepadConfig || typeof gamepadConfig !== 'object') {
      return 'Unbound';
    }

    switch (actionValue) {
      case 'firePrimaryButton':
        return gamepadConfig.firePrimaryButton == null ? 'Unbound' : String(gamepadConfig.firePrimaryButton);
      case 'fireSecondaryButton':
        return gamepadConfig.fireSecondaryButton == null ? 'Unbound' : String(gamepadConfig.fireSecondaryButton);
      case 'interactButton':
        return gamepadConfig.interactButton == null ? 'Unbound' : String(gamepadConfig.interactButton);
      case 'pauseButton':
        return gamepadConfig.pauseButton == null ? 'Unbound' : String(gamepadConfig.pauseButton);
      default:
        return 'Unbound';
    }
  }

  getMenuTextLine(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.menuTexts.length) {
      return null;
    }

    return this.menuTexts.at(index) ?? null;
  }

  renderMenuLine(index, text, isSelected) {
    const menuText = this.getMenuTextLine(index);
    if (!menuText) {
      return;
    }

    menuText.setVisible(true);
    menuText.setText(`${isSelected ? '▶ ' : ''}${text}`);
    menuText.setColor(isSelected ? '#5aff9a' : '#c0d8cc');
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
    this.gamepadStatusText.setVisible(false);

    this.menuTexts.forEach((menuText) => menuText.setVisible(false));

    const { width, height } = this.scale;

    if (this.menuMode === 'main') {
      const menuStartY = height * 0.58;
      this.mainOptions.forEach((option, index) => {
        this.menuTexts[index].setPosition(width / 2, menuStartY + index * 38);
        const selected = index === this.mainSelection;
        this.renderMenuLine(index, option, selected);
      });
      this.gamepadStatusText.setY(menuStartY - 42);
      this.helpText.setY(menuStartY + this.mainOptions.length * 38 + 24);
      this.helpText.setText(this.mainMenuMessage || '');
      return;
    }

    // Restore default vertical positions for non-main menus
    this.menuTexts.forEach((menuText, index) => {
      menuText.setPosition(width / 2, height * 0.44 + index * 38);
    });

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
        this.renderMenuLine(index, line, selected);
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

      this.renderMenuLine(index, `${action.label}: ${binding}${bindSuffix}`, selected);
    });

    const restoreIndex = actionList.length;
    const restoreSelected = restoreIndex === this.remapSelection;
    const restorePending = this.pendingRestoreMode === this.menuMode;
    this.renderMenuLine(
      restoreIndex,
      `Restore Defaults${restorePending ? '  [Press Confirm Again]' : ''}`,
      restoreSelected
    );

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

    if (this.scene.isActive('SectorCompleteScene') || this.scene.isPaused('SectorCompleteScene') || this.scene.isSleeping('SectorCompleteScene')) {
      this.scene.stop('SectorCompleteScene');
    }

    if (this.scene.isActive('GameOverScene') || this.scene.isPaused('GameOverScene') || this.scene.isSleeping('GameOverScene')) {
      this.scene.stop('GameOverScene');
    }

    if (this.scene.isActive('PauseScene') || this.scene.isPaused('PauseScene') || this.scene.isSleeping('PauseScene')) {
      this.scene.stop('PauseScene');
    }

    if (this.scene.isActive('GameScene') || this.scene.isPaused('GameScene') || this.scene.isSleeping('GameScene')) {
      this.scene.stop('GameScene');
    }

    this.registry.set(PAUSE_BUTTON_ARMED_KEY, false);
    this.registry.set('pauseInputLockUntil', this.time.now + 700);

    this.registry.set('sectorIndex', normalizedSector);
    this.scene.start('GameScene', {
      sectorIndex: normalizedSector,
      carryResources: false
    });
    this.scene.stop('StartScene');
  }

  playSound(key, volume = 1) {
    if (this.cache.audio.has(key)) {
      this.sound.play(key, { volume });
    }
  }
}