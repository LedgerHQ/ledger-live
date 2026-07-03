import type { OptionalFeatureMap } from "@shared/feature-flags";
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
export declare function parseExtraFeatureFlags<T = OptionalFeatureMap>(rawExtraFeatureFlags: string | undefined): T;
//# sourceMappingURL=featureFlagsJsonUtils.d.ts.map