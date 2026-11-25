import { resolveSettingsSection, type SettingsSectionId } from "./settingsSections";

/** Addresses the new Settings do not cover yet: they keep the legacy page until their own tickets. */
const SECTIONS_STILL_ON_LEGACY_SETTINGS: ReadonlySet<string> = new Set([
  "help",
  "experimental",
  "developer",
]);

export type SettingsRoute = Readonly<{
  showLegacySettings: boolean;
  selectedSection: SettingsSectionId;
}>;

/** Reads the address after `/settings/`: which page to show and which section to select. */
export function getSettingsRoute(subPath: string, isNewSettingsEnabled: boolean): SettingsRoute {
  const [requestedSection = ""] = subPath.split("/");
  return {
    showLegacySettings:
      !isNewSettingsEnabled || SECTIONS_STILL_ON_LEGACY_SETTINGS.has(requestedSection),
    selectedSection: resolveSettingsSection(requestedSection),
  };
}
