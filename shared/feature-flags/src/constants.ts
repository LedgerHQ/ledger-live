import type { Feature, FeatureId, Features, FeatureFlagsState } from "./data/schema";
import * as flags from "./flags";

/**
 * Dictionary of feature flags schemas where keys matches the feature name
 * and values are the feature flags schemas as zod objects.
 */
export const FEATURE_FLAGS_SCHEMAS = flags;

/**
 * Dictionary of default configuration for each feature flags where each key
 * matches the feature name and values are the default configuration.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const FEATURE_FLAGS_DEFAULTS = Object.fromEntries<Feature>(
  Object.entries(FEATURE_FLAGS_SCHEMAS).map(([featureId, featureSchema]) => [
    featureId,
    featureSchema.parse(undefined),
  ]),
) as Features;

/** Initial state for the `featureFlags` slice — every flag set to its registered default. */
export const FEATURE_FLAGS_INITIAL_STATE: FeatureFlagsState = {
  overrides: {},
  resolved: FEATURE_FLAGS_DEFAULTS,
  bannerVisible: false,
  remoteFlagsReady: false,
};

/** Default polling interval for fetching remote flags, in milliseconds: 5 minutes. */
export const FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Resolves every known feature flag via the provided `getFeature` accessor, returning a map of
 * the non-null results. Used by debug tooling and E2E suites to snapshot the full flag state.
 */
export const getAllFeatureFlags = (
  getFeature: (key: FeatureId) => Feature | null,
): Partial<{ [key in FeatureId]: Feature }> => {
  const res: Partial<{ [key in FeatureId]: Feature }> = {};
  (Object.keys(FEATURE_FLAGS_DEFAULTS) as FeatureId[]).forEach(key => {
    const value = getFeature(key);
    if (value !== null) res[key] = value;
  });
  return res;
};
