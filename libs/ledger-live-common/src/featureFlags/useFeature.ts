import { useMemo } from "react";
import { useFeatureFlags } from "./provider";
import { FeatureId, Feature } from "@ledgerhq/types-live";
import { DEFAULT_FEATURES, DEFAULT_FEATURE } from "./defaultFeatures";

/**
 * Hook that returns feature information based on its `featureId`.
 *
 * @dev If the value returned by `featureFlags.getFeature` is undefined
 * or null it will return `DEFAULT_FEATURE` instead.
 *
 * @param featureId
 * @returns a feature.
 */
const useFeature = <T extends FeatureId>(featureId: T) => {
  const featureFlags = useFeatureFlags();
  const value = useMemo(() => featureFlags.getFeature(featureId), [featureFlags, featureId]);
  return (value || DEFAULT_FEATURE) as Feature<(typeof DEFAULT_FEATURES)[T]["params"]>;
};

export default useFeature;
