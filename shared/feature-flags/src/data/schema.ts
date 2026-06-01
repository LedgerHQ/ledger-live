import { z } from "zod";
import { FeatureSchema } from "./schema.base";
import * as flags from "../flags";

// Re-export internal base schema to allow consumers to use the schema directly
export { FeatureSchema } from "./schema.base";

/** Registry of all available feature flags. */
export const flagRegistry = flags;

/** Represents a feature flag with optional parameters. */
export type Feature<T = unknown> = z.infer<typeof FeatureSchema> & { params?: T };

/** Represents the unique identifier of a feature flag. */
export type FeatureId = keyof typeof flagRegistry;

/** Represents a full set of feature flags. */
export type FeatureMap<T = Features[FeatureId]> = { [key in FeatureId]: T };

/** Represents a partial set of feature flags, used for overrides and partial resolution. */
export type OptionalFeatureMap<T = Features[FeatureId]> = { [key in FeatureId]?: T };

/** Represents the state of feature flags in the store. */
export interface FeatureFlagsState {
  /** User-set local overrides that take priority over remote and env values during resolution. */
  overrides: PartialFeatures;
  /** Final computed value for every flag after applying the resolution chain (override > env > remote > default). */
  resolved: Features;
  /** Whether the developer feature flags banner/button is visible in the UI. */
  bannerVisible: boolean;
  /**
   * Wall-clock timestamp of the last `syncRemoteConfig` dispatch, or `null`
   * until the first remote-flag fetch has populated the slice. Observable
   * signal for callers that need to know remote values are resolved (e.g. e2e
   * harness handshake) rather than reading initial defaults.
   */
  lastRemoteSyncAt: number | null;
}

/** Represents the resolved values of all feature flags. */
export type Features = { [K in FeatureId]: z.infer<(typeof flagRegistry)[K]> };

/** Represents a partial set of feature flags, used for overrides and partial resolution. */
export type PartialFeatures = { [K in FeatureId]?: Features[K] };

/** Represents the shape of the feature flags state in the store. */
export type WithFeatureFlags = { featureFlags: FeatureFlagsState };

/** Represents the feature flags resolution configuration. */
export type ResolutionConfig = z.infer<typeof ResolutionConfigSchema>;

/** Schema that validates allowed feature flag IDs. */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const FeatureIdSchema = z.enum(Object.keys(flagRegistry) as [FeatureId, ...FeatureId[]]);

/** Schema that validates a single feature flag override value. */
export const OverrideValueSchema = FeatureSchema.extend({ params: z.unknown().optional() });

/** Schema that validates the entire feature flags state. */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const FeatureFlagsStateSchema = z.object({
  overrides: z.record(z.string(), OverrideValueSchema.optional()).default({}),
  resolved: z.object(flagRegistry),
  bannerVisible: z.boolean(),
  lastRemoteSyncAt: z.number().nullable().default(null),
}) as z.ZodType<FeatureFlagsState>;

/** Schema that validates the resolution configuration. */
export const ResolutionConfigSchema = z.object({
  platform: z.enum(["desktop", "ios", "android"]).optional(),
  appVersion: z.string().optional(),
  appLanguage: z.string().optional(),
  envFlags: z.record(z.string(), OverrideValueSchema.optional()).optional(),
});
