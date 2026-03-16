import type { Feature } from "./data/schema";
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
export const FEATURE_FLAGS_DEFAULTS = Object.fromEntries<Feature>(
  Object.entries(FEATURE_FLAGS_SCHEMAS).map(([featureId, featureSchema]) => [
    featureId,
    featureSchema.parse(undefined),
  ]),
);
