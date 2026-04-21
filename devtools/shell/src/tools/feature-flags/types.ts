import type { FeatureId, Features, PartialFeatures } from "@shared/feature-flags";

export interface FeatureFlagsToolProps {
  overrides: PartialFeatures;
  resolved: Features;
  setOverride: <T extends FeatureId>(key: T, value: Features[T] | undefined) => void;
  clearOverride: (key: FeatureId) => void;
  clearAllOverrides: () => void;
  defaults?: PartialFeatures;
  remote?: PartialFeatures;
  importOverrides?: (overrides: PartialFeatures) => void;
  exportOverrides?: () => PartialFeatures;
}

export type FlagFilter = "all" | "enabled" | "disabled" | "overridden";

export interface FlagDisplayState {
  id: FeatureId;
  resolved: Features[FeatureId];
  override?: Features[FeatureId];
  remote?: Features[FeatureId];
  default?: Features[FeatureId];
  isOverridden: boolean;
}
