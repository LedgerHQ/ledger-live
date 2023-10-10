import { useMemo } from "react";
import { useFeatureFlags } from "./FeatureFlagsContext";
import { FeatureId, Feature, FeatureParam } from "@ledgerhq/types-live";

/**
 * Hook that returns a feature information based on its `featureId`.
 *
 * @dev If the value returned by `featureFlags.getFeature` is null it will
 * return null.
 *
 * @param featureId
 * @returns a feature.
 */
const useFeature = <T extends FeatureId>(featureId: T): Feature<FeatureParam<T>> | null => {
  const featureFlags = useFeatureFlags();
  const value = useMemo(() => featureFlags.getFeature(featureId), [featureFlags, featureId]);
  return value;
};

export default useFeature;
