import type { SettingsPort, SettingsTheme, UpdateOf } from "@features/flow-settings";

/** Settings of the General section, on both apps. */
export type GeneralSettingsValues = Readonly<{
  theme: SettingsTheme;
  /** App language id, e.g. `en`. */
  language: string;
  /** Countervalue ticker, e.g. `USD`. */
  currency: string;
}>;

export type GeneralSettingUpdate = UpdateOf<GeneralSettingsValues>;

/** One option of a select: the value stored and the label shown. */
export type SettingsChoice = Readonly<{ value: string; label: string; description?: string }>;

/** What the General section needs beyond its values: the options the app supports, Ledger Sync. */
export type GeneralSettingsData = Readonly<{
  languages: readonly SettingsChoice[];
  currencies: readonly SettingsChoice[];
  ledgerSync: Readonly<{
    isActive: boolean;
    /** Opens Ledger Sync: activation, or management once activated. */
    open: () => void;
  }>;
}>;

/** The port the app provides to the General section: its values, its changes and its data. */
export type GeneralSettingsPort = SettingsPort<GeneralSettingsValues, GeneralSettingUpdate> &
  GeneralSettingsData;

/** What a change of a General setting does in the app. One method per setting. */
export type GeneralSideEffects = Readonly<{
  setTheme(theme: SettingsTheme): void;
  setLanguage(language: string): void;
  setCurrency(ticker: string): void;
}>;

/** The Region setting, on desktop only. */
export type RegionSettingsValues = Readonly<{
  /** Locale of the formats (dates, numbers), e.g. `en-US`. */
  region: string;
}>;

export type RegionUpdate = UpdateOf<RegionSettingsValues>;

/** What a Region change does in the app. */
export type RegionSideEffects = Readonly<{ setRegion(locale: string): void }>;

export type RegionSettingsPort = SettingsPort<RegionSettingsValues, RegionUpdate>;

/** The date formats a user can pick on mobile. */
export type SettingsDateFormat = "default" | "DD/MM/YYYY" | "MM/DD/YYYY";

/** The Date format setting, on mobile only. */
export type DateFormatSettingsValues = Readonly<{ dateFormat: SettingsDateFormat }>;

export type DateFormatUpdate = UpdateOf<DateFormatSettingsValues>;

export type DateFormatSettingsPort = SettingsPort<DateFormatSettingsValues, DateFormatUpdate>;
