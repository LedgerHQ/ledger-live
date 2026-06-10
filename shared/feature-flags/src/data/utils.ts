import { FeatureIdSchema, type FeatureId } from "./schema";

const FEATURE_ID_SET = new Set<string>(FeatureIdSchema.options);

/** Type guard: whether a string is a registered feature flag id. */
export function isValidFeatureId(key: string): key is FeatureId {
  return FEATURE_ID_SET.has(key);
}
