import type { FeatureId, Features, PartialFeatures } from "@shared/feature-flags";

export interface FeatureFlagsToolProps {
  overrides: PartialFeatures;
  resolved: Features;
  setOverride: <T extends FeatureId>(key: T, value: Features[T] | undefined) => void;
  setAllOverrides: (overrides: PartialFeatures) => void;
  clearOverride: (key: FeatureId) => void;
  clearAllOverrides: () => void;
}

export type FlagFilter = "all" | "enabled" | "disabled" | "overridden";

export interface FlagDisplayState {
  id: FeatureId;
  resolved: Features[FeatureId];
  override?: Features[FeatureId];
  isOverridden: boolean;
}
