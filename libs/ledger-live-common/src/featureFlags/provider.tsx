import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import type { FeatureId, Feature } from "@ledgerhq/types-live";

type State = {
  getFeature: (_: FeatureId) => Feature | null;
  overrideFeature: (_: FeatureId, value: Feature) => void;
  resetFeature: (_: FeatureId) => void;
};

const initialState: State = {
  getFeature: (_) => ({ enabled: false }),
  overrideFeature: (_) => {},
  resetFeature: (_) => {},
};

const FeatureFlagsContext = createContext<State>(initialState);

export function useFeatureFlags(): State {
  return useContext<State>(FeatureFlagsContext);
}

type Props = {
  getFeature: (_: FeatureId) => Feature | null;
  overrideFeature: (_: FeatureId, value: Feature) => void;
  resetFeature: (_: FeatureId) => void;
  children?: ReactNode;
};

export function FeatureFlagsProvider({
  getFeature,
  overrideFeature,
  resetFeature,
  children,
}: Props): JSX.Element {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      getFeature,
      overrideFeature,
      resetFeature,
    }));
  }, [getFeature, overrideFeature, resetFeature]);

  return (
    <FeatureFlagsContext.Provider value={state}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
