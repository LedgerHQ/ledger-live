import { useMemo } from "react";
import { useFeatureFlags } from "./FeatureFlagsContext";
import { FeatureId, Feature, FeatureParam } from "@ledgerhq/types-live";

/**
 * Hook that returns the value of a feature flag based on its `featureId`.
 *
 * @dev do not modify this function to make it return a default arbitrary value
 * instead of null, this should not be handled at this level.
 *
 * @param featureId
 * @returns a feature flag value or null if the feature flag is not found
 * (neither in the remote configuration, in the cache or in the local defaults).
 */
const useFeature = <T extends FeatureId>(featureId: T): Feature<FeatureParam<T>> | null => {
  const featureFlags = useFeatureFlags();
  const value = useMemo(() => featureFlags.getFeature(featureId), [featureFlags, featureId]);
  return value;
};

export default useFeature;
