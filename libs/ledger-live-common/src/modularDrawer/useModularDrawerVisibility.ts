import { useCallback } from "react";
import { useFeature } from "../featureFlags";
import { ModularDrawerLocation } from "./enums";

type ModularDrawerFeatureFlagKey = "lldModularDrawer" | "llmModularDrawer";

export type ModularDrawerVisibleParams =
  | { location: ModularDrawerLocation.LIVE_APP; liveAppId: string }
  | { location: Exclude<ModularDrawerLocation, ModularDrawerLocation.LIVE_APP> };

export function useModularDrawerVisibility({
  modularDrawerFeatureFlagKey,
}: {
  modularDrawerFeatureFlagKey: ModularDrawerFeatureFlagKey;
}) {
  const featureModularDrawer = useFeature(modularDrawerFeatureFlagKey);

  const isModularDrawerVisible = useCallback(
    (params: ModularDrawerVisibleParams) => {
      if (!featureModularDrawer?.enabled) return false;

      if (params.location === ModularDrawerLocation.LIVE_APP) {
        const isLiveAppEnabled = featureModularDrawer.params?.[params.location] ?? false;
        if (!isLiveAppEnabled) return false;

        const { liveAppId } = params;
        const whitelisted = featureModularDrawer.params?.live_apps_whitelisted ?? [];
        const blacklisted = featureModularDrawer.params?.live_apps_blacklisted ?? [];

        if (whitelisted.length > 0 && !whitelisted.includes(liveAppId)) {
          return false;
        }

        if (blacklisted.includes(liveAppId)) {
          return false;
        }

        return true;
      }

      return featureModularDrawer.params?.[params.location] ?? false;
    },
    [featureModularDrawer],
  );

  return {
    isModularDrawerVisible,
  };
}
