import type { FeatureId, Features, FeatureFlagsState } from "./schema";

type WithFeatureFlags = { featureFlags: FeatureFlagsState };

export const selectFeature = <T extends FeatureId>(s: WithFeatureFlags, key: T): Features[T] =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  s.featureFlags.resolved[key] as Features[T];

export const featureFlagsOverridesSelector = (s: WithFeatureFlags) => s.featureFlags.overrides;
export const featureFlagsBannerVisibleSelector = (s: WithFeatureFlags) =>
  s.featureFlags.bannerVisible;
