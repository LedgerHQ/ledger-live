import { matchPath } from "react-router";
import { useSettingsGateViewModel } from "@features/flow-settings/web";
import { SETTINGS_ROUTE_PATH } from "../routes";

/** Whether the pathname is displayed by the new Settings (flag ON, not a legacy-only section). */
export function useIsNewSettingsPage(pathname: string): boolean {
  const settingsMatch = matchPath(SETTINGS_ROUTE_PATH, pathname);
  const { showLegacySettings } = useSettingsGateViewModel(settingsMatch?.params["*"] ?? "");
  return settingsMatch !== null && !showLegacySettings;
}
