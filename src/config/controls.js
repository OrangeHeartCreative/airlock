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

export function getControlPresetName(registry) {
  const presetName = registry.get('controlPreset') ?? 'default';
  return CONTROL_PRESETS[presetName] ? presetName : 'default';
}

export function getControlConfig(registry) {
  const presetName = getControlPresetName(registry);
  const preset = CONTROL_PRESETS[presetName];
  const customGamepadBinds = registry.get('customGamepadBinds') ?? {};

  const gamepadConfig = {
    ...preset.gamepad,
    ...customGamepadBinds
  };

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

export function clearCustomBindings(registry) {
  registry.set('customGamepadBinds', {});
}

export function clearCustomGamepadBindings(registry) {
  registry.set('customGamepadBinds', {});
}

export function hasCustomBindings(registry) {
  const gamepadCount = Object.keys(registry.get('customGamepadBinds') ?? {}).length;
  return gamepadCount > 0;
}
