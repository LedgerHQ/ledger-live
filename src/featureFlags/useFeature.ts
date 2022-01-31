import { useFeatureFlags } from "./provider";
import { Feature, FeatureId } from "./types";

export default function useFeature(key: FeatureId): Feature | null {
  const featureFlags = useFeatureFlags();

  return featureFlags.getFeature(key);
}
