import { FeatureIdSchema, flagRegistry, type FeatureId, type Features } from "./schema";

const FEATURE_ID_SET = new Set<string>(FeatureIdSchema.options);

/** Type guard: whether a string is a registered feature flag id. */
export function isValidFeatureId(key: string): key is FeatureId {
  return FEATURE_ID_SET.has(key);
}

/** Parses an untrusted feature value with the registered schema for its key. */
export function parseFeatureValue(key: FeatureId, value: unknown): Features[FeatureId] | undefined {
  const result = flagRegistry[key].safeParse(value);

  return result.success ? result.data : undefined;
}
