import type { SettingsSectionId } from "./settingsSections";

/** The sections of the mobile Settings home, in the order of the design: Notifications is mobile only. */
export const SETTINGS_HOME_SECTIONS = [
  "general",
  "assetManagement",
  "security",
  "notifications",
  "privacy",
  "about",
] as const satisfies readonly (SettingsSectionId | "notifications")[];

export type SettingsHomeSectionId = (typeof SETTINGS_HOME_SECTIONS)[number];
