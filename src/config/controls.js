export const CONTROL_PRESETS = {
  default: {
    label: 'Default (RT/RB + A)',
    gamepad: {
      firePrimaryButton: 7,
      fireSecondaryButton: 5,
      interactButton: 0,
      pauseButton: 9
    }
  },
  tactical: {
    label: 'Tactical (LT/LB + Y)',
    gamepad: {
      firePrimaryButton: 6,
      fireSecondaryButton: 4,
      interactButton: 3,
      pauseButton: 9
    }
  }
};

export const GAMEPAD_ACTIONS = [
  { value: 'firePrimaryButton', label: 'Fire Primary Button' },
  { value: 'fireSecondaryButton', label: 'Fire Secondary Button' },
  { value: 'interactButton', label: 'Interact Button' },
  { value: 'pauseButton', label: 'Pause Button' }
];

function resolveControlPreset(presetName) {
  const normalizedName = typeof presetName === 'string' ? presetName : 'default';
  if (Object.prototype.hasOwnProperty.call(CONTROL_PRESETS, normalizedName)) {
    return {
      name: normalizedName,
      preset: CONTROL_PRESETS[normalizedName]
    };
  }

  return {
    name: 'default',
    preset: CONTROL_PRESETS.default
  };
}

export function getControlPresetName(registry) {
  const presetName = registry.get('controlPreset') ?? 'default';
  return resolveControlPreset(presetName).name;
}

export function getControlConfig(registry) {
  const presetName = getControlPresetName(registry);
  const { preset } = resolveControlPreset(presetName);
  const customGamepadBinds = registry.get('customGamepadBinds') ?? {};

  const gamepadConfig = {
    ...preset.gamepad,
    ...customGamepadBinds
  };

  const pauseConflicts = new Set([
    gamepadConfig.interactButton,
    gamepadConfig.firePrimaryButton,
    gamepadConfig.fireSecondaryButton
  ]);

  if (pauseConflicts.has(gamepadConfig.pauseButton)) {
    gamepadConfig.pauseButton = preset.gamepad.pauseButton;
  }

  return {
    label: preset.label,
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

export function setCustomGamepadBinding(registry, action, buttonIndex) {
  const currentBindings = registry.get('customGamepadBinds') ?? {};
  registry.set('customGamepadBinds', {
    ...currentBindings,
    [action]: buttonIndex
  });
}

export function clearCustomGamepadBindings(registry) {
  registry.set('customGamepadBinds', {});
}

export function clearCustomBindings(registry) {
  clearCustomGamepadBindings(registry);
}

export function hasCustomBindings(registry) {
  const gamepadCount = Object.keys(registry.get('customGamepadBinds') ?? {}).length;
  return gamepadCount > 0;
}
