import type { OptionalFeatureMap } from "@shared/feature-flags";

function isOptionalFeatureMap(value: unknown): value is OptionalFeatureMap {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Parses and validates the `E2E_FEATURE_FLAGS_JSON` env var into a feature flag map.
 *
 * Shared between Desktop (Playwright) and Mobile (Detox) E2E suites. The default
 * return type matches Desktop's `OptionalFeatureMap` from `@ledgerhq/types-live`.
 * Mobile callers should pass `PartialFeatures` from `@shared/feature-flags`:
 *
 *   parseExtraFeatureFlags<PartialFeatures>(process.env.E2E_FEATURE_FLAGS_JSON)
 *
 * Returns an empty object when the input is empty/undefined. Throws on
 * invalid JSON, or when the parsed value is not a plain JSON object
 * (arrays, scalars, and null are rejected).
 */
export function parseExtraFeatureFlags<T = OptionalFeatureMap>(
  rawExtraFeatureFlags: string | undefined,
): T {
  const normalizedValue = rawExtraFeatureFlags?.trim();
  if (!normalizedValue) return {} as T;

  const helpText =
    "Expected E2E_FEATURE_FLAGS_JSON to be a JSON object. For example: " +
    '`{"myFeature":{"enabled":true,"params":{"foo":"bar"}}}`';

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedValue);
  } catch (error) {
    throw new Error(
      `Invalid E2E_FEATURE_FLAGS_JSON: ${
        error instanceof Error ? error.message : String(error)
      }. ${helpText}`,
    );
  }

  if (!isOptionalFeatureMap(parsed)) {
    throw new Error(
      `Invalid E2E_FEATURE_FLAGS_JSON: E2E_FEATURE_FLAGS_JSON must be a JSON object mapping feature flag keys to configuration objects. ${helpText}`,
    );
  }

  return parsed as T;
}
