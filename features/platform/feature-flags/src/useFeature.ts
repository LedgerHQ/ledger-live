import { useSelector } from "react-redux";
import {
  selectFeature,
  type FeatureFlagsState,
  type FeatureId,
  type Features,
} from "@shared/feature-flags";

type WithFeatureFlags = { featureFlags: FeatureFlagsState };

export const useFeature = <T extends FeatureId>(key: T): Features[T] | null =>
  useSelector((state: WithFeatureFlags) => selectFeature(state, key));
