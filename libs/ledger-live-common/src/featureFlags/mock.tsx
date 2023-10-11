import React from "react";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { FeatureFlagsContextValue, FeatureFlagsProvider } from "./FeatureFlagsContext";

export function makeMockedContextValue(
  mockedFeatures: Partial<Record<FeatureId, Feature>>,
): FeatureFlagsContextValue {
  return {
    isFeature: () => true,
    getFeature: (featureId: FeatureId) => mockedFeatures[featureId] || null,
    overrideFeature: () => {},
    resetFeature: () => {},
    resetFeatures: () => {},
    getAllFlags: () => mockedFeatures,
  };
}

export function makeMockedFeatureFlagsProviderWrapper(
  mockedContextValue: FeatureFlagsContextValue,
) {
  const MockedFeatureProviderWrapper: React.FC<{ children: React.ReactNode | null }> = ({
    children,
  }) => <FeatureFlagsProvider value={mockedContextValue}>{children}</FeatureFlagsProvider>;
  return MockedFeatureProviderWrapper;
}

export const basicMockedFeatureFlagsProviderWrapper = makeMockedFeatureFlagsProviderWrapper(
  makeMockedContextValue({}),
);
