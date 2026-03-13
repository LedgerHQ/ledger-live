import type { FeatureId, Features, FeatureFlagsState } from "./schema";

type WithFeatureFlags = { featureFlags: FeatureFlagsState };

export const selectFeature = <T extends FeatureId>(s: WithFeatureFlags, key: T): Features[T] =>
  s.featureFlags.resolved[key];

export const featureFlagsOverridesSelector = (s: WithFeatureFlags) => s.featureFlags.overrides;
export const featureFlagsBannerVisibleSelector = (s: WithFeatureFlags) =>
  s.featureFlags.bannerVisible;
