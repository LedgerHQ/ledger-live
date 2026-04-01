import type { OptionalFeatureMap } from "@ledgerhq/types-live";

function isOptionalFeatureMap(value: unknown): value is OptionalFeatureMap {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseExtraFeatureFlags(
  rawExtraFeatureFlags: string | undefined,
): OptionalFeatureMap {
  const normalizedValue = rawExtraFeatureFlags?.trim();
  if (!normalizedValue) return {};

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

  return parsed;
}
