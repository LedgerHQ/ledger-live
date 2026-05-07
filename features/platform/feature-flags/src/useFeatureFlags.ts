import { useSelector } from "react-redux";
import type { FeatureFlagsState, Features } from "@shared/feature-flags";

type WithFeatureFlags = { featureFlags: FeatureFlagsState };

export const useFeatureFlags = (): Features =>
  useSelector((state: WithFeatureFlags) => state.featureFlags.resolved);
