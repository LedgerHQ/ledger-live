import { useMemo } from "react";
import { FeatureId } from "@ledgerhq/types-live";
import { useFeatureFlags } from "./provider";
import { DEFAULT_FEATURES } from "./defaultFeatures";

/**
 *
 * @returns whether one or more flags are locally overridden
 */
export function useHasLocallyOverriddenFeatureFlags(): boolean {
  const { getFeature } = useFeatureFlags();
  return useMemo(
    () =>
      Object.entries(DEFAULT_FEATURES).some(([featureId]) => {
        try {
          const val = getFeature(featureId as FeatureId);
          return val?.overridesRemote || val?.overriddenByEnv;
        } catch (e) {
          return false;
        }
      }),
    [getFeature],
  );
}
