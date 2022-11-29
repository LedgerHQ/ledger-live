import { useMemo } from "react";
import { useFeatureFlags } from "./provider";
import { FeatureId, Feature } from "@ledgerhq/types-live";

const useFeature = (key: FeatureId): Feature | null => {
  const featureFlags = useFeatureFlags();
  const value = useMemo(
    () => featureFlags.getFeature(key),
    [featureFlags, key]
  );
  return value;
};

export default useFeature;
