import type { Feature } from "@shared/feature-flags";

export type FeatureFlagsGetParams = {
  featureFlagIds: string[];
};

export type FeatureFlagsGetResponse = {
  features: Record<string, Feature<unknown> | null>;
};

export type MethodIds = "custom.featureFlags.get";
