import React, {
  useContext,
  useEffect,
  createContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { GlobalCatalog } from "./types";
import { Loadable } from "../types";

import api from "./api";

const initialState: Loadable<GlobalCatalog> = {
  isLoading: false,
  value: null,
  error: null,
};

export type GlobalCatalogDataAPI = {
  fetchGlobalCatalog: () => Promise<GlobalCatalog>;
};

type GlobalCatalogContextType = {
  state: Loadable<GlobalCatalog>;
  updateCatalog: () => Promise<void>;
};

export const globalCatalogContext = createContext<GlobalCatalogContextType>({
  state: initialState,
  updateCatalog: () => Promise.resolve(),
});

type CatalogProviderProps = {
  children: React.ReactNode;
  provider: string;
  updateFrequency: number;
};

export function useGlobalCatalog(): Loadable<GlobalCatalog> {
  return useContext(globalCatalogContext).state;
}

export function GlobalCatalogProvider({
  children,
  provider,
  updateFrequency,
}: CatalogProviderProps): JSX.Element {
  const [state, setState] = useState<Loadable<GlobalCatalog>>(initialState);

  const updateCatalog = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
    }));

    try {
      const value = await api.fetchGlobalCatalog(provider);
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

  const value: GlobalCatalogContextType = useMemo(
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
    <globalCatalogContext.Provider value={value}>
      {children}
    </globalCatalogContext.Provider>
  );
}
