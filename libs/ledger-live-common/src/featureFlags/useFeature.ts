import { useFeatureFlags } from "./provider";
import { FeatureId, Feature } from "@ledgerhq/types-live";

const useFeature = (key: FeatureId): Feature | null => {
  const featureFlags = useFeatureFlags();

  return featureFlags.getFeature(key);
};

export default useFeature;
