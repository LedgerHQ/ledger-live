import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { FeatureId, Feature } from "./types";

type State = {
  getFeature: (_: FeatureId) => Feature | null;
};

const initialState: State = {
  getFeature: (_) => ({ enabled: false }),
};

const FeatureFlagsContext = createContext<State>(initialState);

export function useFeatureFlags(): State {
  return useContext<State>(FeatureFlagsContext);
}

type Props = {
  getFeature: (_: FeatureId) => Feature | null;
  children?: ReactNode;
};

export function FeatureFlagsProvider({
  getFeature,
  children,
}: Props): JSX.Element {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      getFeature,
    }));
  }, [getFeature]);

  return (
    <FeatureFlagsContext.Provider value={state}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
