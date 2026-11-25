import type { SettingsPort, SettingsValues, SettingUpdate } from "../types";

type KeyedUpdate<Values> = Readonly<{ key: keyof Values; value: Values[keyof Values] }>;

/**
 * In-memory port for tests, for the values of any section: each update changes the values and is
 * recorded in `updates`.
 */
export function createFakePort<Values extends object, Update extends KeyedUpdate<Values>>(
  defaults: Values,
  initial?: Partial<Values>,
) {
  const updates: Update[] = [];
  const state: { values: Values } = { values: { ...defaults, ...initial } };

  const port: SettingsPort<Values, Update> = {
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

const DEFAULT_SETTINGS_VALUES: SettingsValues = {
  theme: "system",
};

/** In-memory port of the shell's own settings. */
export function createFakeSettingsPort(initial?: Partial<SettingsValues>) {
  return createFakePort<SettingsValues, SettingUpdate>(DEFAULT_SETTINGS_VALUES, initial);
}
