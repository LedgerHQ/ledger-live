import type { FeatureId, Features, PartialFeatures, WithFeatureFlags } from "./schema";

/**
 * Selects a single resolved feature flag by its identifier, returning the
 * fully-typed value including params. The generic ensures the return type
 * matches the flag's Zod-inferred schema.
 *
 * @param s
 * Any store state containing the `featureFlags` slice.
 *
 * @param key
 * The feature flag identifier.
 *
 * @return
 * The resolved feature flag value with typed params.
 */
export function selectFeature<T extends FeatureId>(s: WithFeatureFlags, key: T): Features[T] {
  return s.featureFlags.resolved[key];
}

/**
 * Selects the entire local overrides map.
 *
 * @param s
 * Any store state containing the `featureFlags` slice.
 */
export function featureFlagsOverridesSelector(s: WithFeatureFlags): PartialFeatures {
  return s.featureFlags.overrides;
}

/**
 * Selects whether the feature flags developer banner is visible.
 *
 * @param s
 * Any store state containing the `featureFlags` slice.
 */
export function featureFlagsBannerVisibleSelector(s: WithFeatureFlags) {
  return s.featureFlags.bannerVisible;
}
