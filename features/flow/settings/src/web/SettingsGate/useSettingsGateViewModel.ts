import { useFeature } from "@features/platform-feature-flags";
import { getSettingsRoute, type SettingsRoute } from "../../logic/settingsRoute";

export function useSettingsGateViewModel(subPath: string): SettingsRoute {
  const newSettings = useFeature("newSettings");
  return getSettingsRoute(subPath, newSettings?.enabled ?? false);
}
