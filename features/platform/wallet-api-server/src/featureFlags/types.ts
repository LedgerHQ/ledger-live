import type { Feature } from "@shared/feature-flags";

export type FeatureFlagsGetParams = {
  featureFlagIds: string[];
};

export type FeatureFlagsGetResponse = {
  features: Record<string, Feature<unknown> | null>;
};

export type MethodIds = "custom.featureFlags.get";

/** What the feature flag rule reads of a manifest: the flags it may read, all of them with `"*"`. */
export type FeatureFlagsManifest = { featureFlags?: string[] | "*" };
