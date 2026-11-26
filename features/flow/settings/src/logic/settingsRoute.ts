import { resolveSettingsSection, type SettingsSectionId } from "./settingsSections";

/** Addresses the new Settings do not cover yet: they keep the legacy page until their own tickets. */
const SECTIONS_STILL_ON_LEGACY_SETTINGS: ReadonlySet<string> = new Set([
  "experimental",
  "developer",
]);

/** Pages that live outside the section tabs. Each one is a flow package of its own. */
export const SETTINGS_STANDALONE_PAGES = ["help"] as const;

export type SettingsStandalonePage = (typeof SETTINGS_STANDALONE_PAGES)[number];

export type SettingsRoute = Readonly<{
  showLegacySettings: boolean;
  selectedSection: SettingsSectionId;
  /** The standalone page to show instead of the section tabs, `null` for the tabs. */
  standalonePage: SettingsStandalonePage | null;
}>;

function toStandalonePage(requestedSection: string): SettingsStandalonePage | null {
  return SETTINGS_STANDALONE_PAGES.find(page => page === requestedSection) ?? null;
}

/** Reads the address after `/settings/`: which page to show and which section to select. */
export function getSettingsRoute(subPath: string, isNewSettingsEnabled: boolean): SettingsRoute {
  const [requestedSection = ""] = subPath.split("/");
  return {
    showLegacySettings:
      !isNewSettingsEnabled || SECTIONS_STILL_ON_LEGACY_SETTINGS.has(requestedSection),
    selectedSection: resolveSettingsSection(requestedSection),
    standalonePage: isNewSettingsEnabled ? toStandalonePage(requestedSection) : null,
  };
}
