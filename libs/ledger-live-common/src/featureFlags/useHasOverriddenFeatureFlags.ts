import { useMemo } from "react";
import { FeatureId } from "@ledgerhq/types-live";
import { useFeatureFlags } from "./provider";
import { defaultFeatures } from "./defaultFeatures";

/**
 *
 * @returns whether one or more flags are locally overridden
 */
export function useHasLocallyOverriddenFeatureFlags(): boolean {
  const { getFeature } = useFeatureFlags();
  return useMemo(
    () =>
      Object.entries(defaultFeatures).some(([featureId]) => {
        try {
          const val = getFeature(featureId as FeatureId);
          return val?.overridesRemote || val?.overriddenByEnv;
        } catch (e) {
          return false;
        }
      }),
    [getFeature]
  );
}
