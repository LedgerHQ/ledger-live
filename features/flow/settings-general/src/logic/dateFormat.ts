import type { DateFormatUpdate, SettingsDateFormat } from "../ports";

export const SETTINGS_DATE_FORMATS: readonly SettingsDateFormat[] = [
  "default",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
];

const DATE_FORMATS: ReadonlySet<string> = new Set(SETTINGS_DATE_FORMATS);

export function isSettingsDateFormat(value: string): value is SettingsDateFormat {
  return DATE_FORMATS.has(value);
}

/** Tells whether a change of the Settings port is the Date format one. */
export function isDateFormatUpdate(update: Readonly<{ key: string }>): update is DateFormatUpdate {
  return update.key === "dateFormat";
}
