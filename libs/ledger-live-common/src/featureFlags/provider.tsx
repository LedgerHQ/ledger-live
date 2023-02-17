import React, { createContext, useContext } from "react";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

type State = {
  isFeature: (_: string) => boolean;
  getFeature: (_: FeatureId) => Feature | null;
  overrideFeature: (_: FeatureId, value: Feature) => void;
  resetFeature: (_: FeatureId) => void;
  resetFeatures: () => void;
};

const initialState: State = {
  isFeature: (_) => false,
  getFeature: (_) => ({ enabled: false }),
  overrideFeature: (_) => {},
  resetFeature: (_) => {},
  resetFeatures: () => {},
};

const FeatureFlagsContext = createContext<State>(initialState);

export function useFeatureFlags(): State {
  return useContext<State>(FeatureFlagsContext);
}

export const FeatureFlagsProvider: React.FC<State> = ({
  children,
  ...providerState
}) => {
  return (
    <FeatureFlagsContext.Provider value={providerState}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
