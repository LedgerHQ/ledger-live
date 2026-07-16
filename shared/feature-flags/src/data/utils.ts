import { FeatureIdSchema, type Feature, type FeatureId } from "./schema";

const FEATURE_ID_SET = new Set<string>(FeatureIdSchema.options);

/** Type guard: whether a string is a registered feature flag id. */
export function isValidFeatureId(key: string): key is FeatureId {
  return FEATURE_ID_SET.has(key);
}

/**
 * Resolves every known feature flag via the provided `getFeature` accessor, returning a map of
 * the non-null results. Used by debug tooling and E2E suites to snapshot the full flag state.
 */
export function getAllFeatureFlags(
  getFeature: (key: FeatureId) => Feature | null,
): Partial<{ [key in FeatureId]: Feature }> {
  const res: Partial<{ [key in FeatureId]: Feature }> = {};
  for (const key of FeatureIdSchema.options) {
    const value = getFeature(key);
    if (value !== null) res[key] = value;
  }
  return res;
}
