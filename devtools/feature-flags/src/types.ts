import type { FeatureId, Features, PartialFeatures } from "@shared/feature-flags";

export interface FeatureFlagsToolProps {
  overrides: PartialFeatures;
  resolved: Features;
  setOverride: <T extends FeatureId>(key: T, value: Features[T] | undefined) => void;
  setAllOverrides: (overrides: PartialFeatures) => void;
  clearOverride: (key: FeatureId) => void;
  clearAllOverrides: () => void;
  defaults?: PartialFeatures;
  remote?: PartialFeatures;
  // Deprecated and unused — kept only so existing callers don't break;
  // They weren't single-responsibility: a host was expected to load the
  // file, parse it, and call setAllOverrides. The tool now owns that whole flow itself.
  // Note: import/export is disabled on mobile until Expo SDK 54 — see README.md.
  importOverrides?: () => void;
  exportOverrides?: () => void;
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
