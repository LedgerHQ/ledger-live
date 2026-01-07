import { Feature } from "@ledgerhq/types-live";

export type FeatureFlagsGetParams = {
  featureFlagIds: string[];
};

export type FeatureFlagsGetResponse = {
  features: Record<string, Feature<unknown> | null>;
};

export type MethodIds = "featureFlags.get";
