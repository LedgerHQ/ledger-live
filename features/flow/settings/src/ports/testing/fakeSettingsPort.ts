import type { SettingsPort, SettingsValues, SettingUpdate } from "../types";

const DEFAULT_SETTINGS_VALUES: SettingsValues = {
  theme: "system",
};

/**
 * In-memory port for tests: each update changes the values and is recorded in `updates`.
 */
export function createFakeSettingsPort(initial?: Partial<SettingsValues>) {
  const updates: SettingUpdate[] = [];
  const state: { values: SettingsValues } = {
    values: { ...DEFAULT_SETTINGS_VALUES, ...initial },
  };

  const port: SettingsPort = {
    get values() {
      return state.values;
    },
    setValue(update) {
      updates.push(update);
      state.values = { ...state.values, [update.key]: update.value };
    },
  };

  return { port, updates };
}
