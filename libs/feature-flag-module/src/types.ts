/**
 * Represents a feature flag value returned by Ledger Live.
 * This is a simplified version of the Feature type for Live Apps.
 */
export type Feature<T = unknown> = {
  /**
   * If false, the feature is disabled
   */
  enabled: boolean;
  /**
   * Additional parameters specific to this feature flag
   */
  params?: T;
};

export type FeatureFlagGetParams = {
  featureFlagIds: string[];
};

export type FeatureFlagGetResult = {
  features: Record<string, Feature<unknown> | null>;
};
