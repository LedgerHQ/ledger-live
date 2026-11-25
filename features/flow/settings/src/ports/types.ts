import type { GeneralSettingsValues } from "./sections/general";

/**
 * Every setting a section can read and change. Each section adds its own values here
 * (`& NextSectionValues`) and keeps them in its own file under `./sections/`.
 */
export type SettingsValues = GeneralSettingsValues;

export type SettingKey = keyof SettingsValues;

/** One change, tagged by its key so each value is checked against its own type. */
export type UpdateOf<Values> = {
  [K in keyof Values]: Readonly<{ key: K; value: Values[K] }>;
}[keyof Values];

export type SettingUpdate = UpdateOf<SettingsValues>;

/**
 * Settings a section reads and changes. Each app provides the values from its own store,
 * so a value can move out of the app later without the sections changing.
 *
 * A section outside this package narrows the port to its own values and updates, and the app
 * provides one port that carries every section: see `useSettingsPort`.
 */
export type SettingsPort<Values = SettingsValues, Update = UpdateOf<Values>> = Readonly<{
  values: Values;
  setValue(update: Update): void;
}>;

/** Any port, whatever the values of its sections. What the provider holds. */
export type AnySettingsPort = SettingsPort<unknown, never>;
