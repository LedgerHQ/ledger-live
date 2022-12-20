import React, {
  useContext,
  useEffect,
  createContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { RampCatalog } from "./types";
import { Loadable } from "../../types";

import api from "./api";

const initialState: Loadable<RampCatalog> = {
  isLoading: false,
  value: null,
  error: null,
};

export type RampCatalogDataAPI = {
  fetchRampCatalog: () => Promise<RampCatalog>;
};

type RampCatalogContextType = {
  state: Loadable<RampCatalog>;
  updateCatalog: () => Promise<void>;
};

export const rampCatalogContext = createContext<RampCatalogContextType>({
  state: initialState,
  updateCatalog: () => Promise.resolve(),
});

type RampCatalogProviderProps = {
  children: React.ReactNode;
  provider: string;
  updateFrequency: number;
};

export function useRampCatalog(): Loadable<RampCatalog> {
  return useContext(rampCatalogContext).state;
}

export function RampCatalogProvider({
  children,
  provider,
  updateFrequency,
}: RampCatalogProviderProps): JSX.Element {
  const [state, setState] = useState<Loadable<RampCatalog>>(initialState);

  const updateCatalog = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
    }));

    try {
      const value = await api.fetchRampCatalog(provider);
      setState(() => ({
        isLoading: false,
        value,
        error: null,
      }));
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        error,
      }));
    }
  }, [provider]);

  const value: RampCatalogContextType = useMemo(
    () => ({
      state,
      updateCatalog,
    }),
    [state, updateCatalog]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      updateCatalog();
    }, updateFrequency);
    updateCatalog();
    return () => {
      clearInterval(interval);
    };
  }, [updateFrequency, updateCatalog]);

  return (
    <rampCatalogContext.Provider value={value}>
      {children}
    </rampCatalogContext.Provider>
  );
}
