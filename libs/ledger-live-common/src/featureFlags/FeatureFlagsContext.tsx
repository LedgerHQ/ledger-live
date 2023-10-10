import { createContext, useContext } from "react";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

export type FeatureFlagsContextValue = {
  isFeature: (_: string) => boolean;
  getFeature: (_: FeatureId) => Feature | null;
  overrideFeature: (_: FeatureId, value: Feature) => void;
  resetFeature: (_: FeatureId) => void;
  resetFeatures: () => void;
  getAllFlags: () => Record<string, Feature>;
};

/**
 * @dev do not export this, this should be accessed exclusively through
 * useFeatureFlags and FeatureFlagsProvider
 */
const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

export const FeatureFlagsProvider = FeatureFlagsContext.Provider;

/**
 * Hook to consume FeatureFlagsContext
 * Throws if not rendered within a FeatureFlagsProvider.
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  const contextValue = useContext(FeatureFlagsContext);
  if (contextValue === undefined)
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider (React context provider)",
    );
  return contextValue;
}
