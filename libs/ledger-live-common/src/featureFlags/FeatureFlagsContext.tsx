import { createContext, useContext } from "react";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

export type FeatureFlagsContextValue = {
  /**
   *
   * @param featureId featureId identifying a potential feature flag
   * @returns true if and only if the parameter matches a feature that is configured.
   */
  isFeature: (featureId: string) => boolean;

  /**
   *
   * @param featureId featureId identifying a feature flag
   * @returns the value of the feature flag if it is defined (remotely or through a default value), otherwise returns null
   */
  getFeature: (featureId: FeatureId) => Feature | null;

  /**
   * function that allows to override the value of a feature flag
   *
   * @param featureId featureId identifying a feature flag
   * @param newValue new value of the feature flag
   * @returns undefined
   */
  overrideFeature: (featureId: FeatureId, newValue: Feature) => void;

  /**
   * resets the overridden feature flag value for a given featureId
   * @param featureId featureId identifying a feature flag
   * @returns undefined
   */
  resetFeature: (featureId: FeatureId) => void;
  /**
   * resets all the overridden feature flags
   * @returns undefined
   */
  resetFeatures: () => void;
};

/**
 * Context used for injecting the feature flagging implementation logic.
 *
 * @dev do not export this, it should be accessed exclusively through
 * useFeatureFlags and FeatureFlagsProvider
 */
const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  isFeature: _ => false,
  getFeature: _ => null,
  overrideFeature: _ => {},
  resetFeature: _ => {},
  resetFeatures: () => {},
});

export const FeatureFlagsProvider = FeatureFlagsContext.Provider;

/**
 * Hook to consume a FeatureFlagsContext
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  return useContext(FeatureFlagsContext);
}
