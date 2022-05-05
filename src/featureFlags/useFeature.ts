import { useFeatureFlags } from "./provider";
import { Feature, FeatureId } from "./types";

const useFeature = (key: FeatureId): Feature | null => {
  const featureFlags = useFeatureFlags();

  return featureFlags.getFeature(key);
};

export default useFeature;
