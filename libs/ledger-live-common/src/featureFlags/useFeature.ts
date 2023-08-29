import { useMemo } from "react";
import { useFeatureFlags } from "./provider";
import { FeatureId, Feature } from "@ledgerhq/types-live";
import { DEFAULT_FEATURES } from "./defaultFeatures";

const useFeature = <T extends FeatureId>(featureId: T) => {
  const featureFlags = useFeatureFlags();
  const value = useMemo(() => featureFlags.getFeature(featureId), [featureFlags, featureId]);
  return value as Feature<(typeof DEFAULT_FEATURES)[T]["params"]>;
};

export default useFeature;
