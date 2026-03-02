export const CONTROL_PRESETS = {
  default: {
    label: 'Default (WASD + RT/RB)',
    keyboard: {
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      fire: 'SPACE',
      interact: 'E',
      pause: 'ESC'
    },
    gamepad: {
      firePrimaryButton: 7,
      fireSecondaryButton: 5,
      interactButton: 0,
      pauseButton: 9
    }
  },
  tactical: {
    label: 'Tactical (IJKL + LT/LB)',
    keyboard: {
      up: 'I',
      down: 'K',
      left: 'J',
      right: 'L',
      fire: 'U',
      interact: 'O',
      pause: 'ESC'
    },
    gamepad: {
      firePrimaryButton: 6,
      fireSecondaryButton: 4,
      interactButton: 3,
      pauseButton: 9
    }
  }
};

export const KEYBOARD_ACTIONS = [
  { value: 'up', label: 'Move Up' },
  { value: 'down', label: 'Move Down' },
  { value: 'left', label: 'Move Left' },
  { value: 'right', label: 'Move Right' },
  { value: 'fire', label: 'Fire' },
  { value: 'interact', label: 'Interact' },
  { value: 'pause', label: 'Pause' }
];

export const GAMEPAD_ACTIONS = [
  { value: 'firePrimaryButton', label: 'Fire Primary Button' },
  { value: 'fireSecondaryButton', label: 'Fire Secondary Button' },
  { value: 'interactButton', label: 'Interact Button' },
  { value: 'pauseButton', label: 'Pause Button' }
];

export function getControlPresetName(registry) {
  const presetName = registry.get('controlPreset') ?? 'default';
  return CONTROL_PRESETS[presetName] ? presetName : 'default';
}

export function getControlConfig(registry) {
  const presetName = getControlPresetName(registry);
  const preset = CONTROL_PRESETS[presetName];
  const customKeyboardBinds = registry.get('customKeyboardBinds') ?? {};
  const customGamepadBinds = registry.get('customGamepadBinds') ?? {};

  const gamepadConfig = {
    ...preset.gamepad,
    ...customGamepadBinds
  };

  return {
    label: preset.label,
    keyboard: {
      ...preset.keyboard,
      ...customKeyboardBinds
    },
    gamepad: {
      ...gamepadConfig,
      fireButtons: [gamepadConfig.firePrimaryButton, gamepadConfig.fireSecondaryButton]
    }
  };
}

export function getControlPresetOptions() {
  return Object.entries(CONTROL_PRESETS).map(([value, preset]) => ({
    value,
    label: preset.label
  }));
}

export function setCustomKeyboardBinding(registry, action, keyName) {
  const currentBindings = registry.get('customKeyboardBinds') ?? {};
  registry.set('customKeyboardBinds', {
    ...currentBindings,
    [action]: keyName
  });
}

export function setCustomGamepadBinding(registry, action, buttonIndex) {
  const currentBindings = registry.get('customGamepadBinds') ?? {};
  registry.set('customGamepadBinds', {
    ...currentBindings,
    [action]: buttonIndex
  });
}

export function clearCustomBindings(registry) {
  registry.set('customKeyboardBinds', {});
  registry.set('customGamepadBinds', {});
}

export function clearCustomKeyboardBindings(registry) {
  registry.set('customKeyboardBinds', {});
}

export function clearCustomGamepadBindings(registry) {
  registry.set('customGamepadBinds', {});
}

export function hasCustomBindings(registry) {
  const keyboardCount = Object.keys(registry.get('customKeyboardBinds') ?? {}).length;
  const gamepadCount = Object.keys(registry.get('customGamepadBinds') ?? {}).length;
  return keyboardCount > 0 || gamepadCount > 0;
}
