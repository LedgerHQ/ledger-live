import { useCallback } from "react";
import { useFeature } from "../featureFlags";
import { ModularDrawerLocation } from "./enums";

type ModularDrawerFeatureFlagKey = "lldModularDrawer" | "llmModularDrawer";

export function useModularDrawerVisibility({
  modularDrawerFeatureFlagKey,
}: {
  modularDrawerFeatureFlagKey: ModularDrawerFeatureFlagKey;
}) {
  const featureModularDrawer = useFeature(modularDrawerFeatureFlagKey);

  const isModularDrawerVisible = useCallback(
    (location: ModularDrawerLocation) => {
      if (!featureModularDrawer?.enabled) return false;
      return featureModularDrawer.params?.[location] ?? false;
    },
    [featureModularDrawer],
  );

  return {
    isModularDrawerVisible,
  };
}
