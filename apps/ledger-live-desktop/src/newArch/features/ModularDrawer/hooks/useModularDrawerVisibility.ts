import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCallback } from "react";
import { ModularDrawerLocation } from "../enums";

export function useModularDrawerVisibility() {
  const featureModularDrawer = useFeature("lldModularDrawer");

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
