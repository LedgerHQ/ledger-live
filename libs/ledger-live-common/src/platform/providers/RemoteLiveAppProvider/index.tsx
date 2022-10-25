import React, {
  useContext,
  useEffect,
  createContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { LiveAppRegistry } from "./types";
import { LiveAppManifest, Loadable } from "../types";

import api from "./api";

const initialState: Loadable<LiveAppRegistry> = {
  isLoading: false,
  value: null,
  error: null,
};

type LiveAppContextType = {
  state: Loadable<LiveAppRegistry>;
  updateManifests: () => Promise<void>;
};

export const liveAppContext = createContext<LiveAppContextType>({
  state: initialState,
  updateManifests: () => Promise.resolve(),
});

type LiveAppProviderProps = {
  children: React.ReactNode;
  provider: string;
  updateFrequency: number;
};

export function useRemoteLiveAppManifest(
  appId: string
): LiveAppManifest | undefined {
  const liveAppRegistry = useContext(liveAppContext).state;

  if (!liveAppRegistry.value) {
    return undefined;
  }

  return liveAppRegistry.value.liveAppById[appId];
}

export function useRemoteLiveAppContext(): LiveAppContextType {
  return useContext(liveAppContext);
}

export function RemoteLiveAppProvider({
  children,
  provider,
  updateFrequency,
}: LiveAppProviderProps): JSX.Element {
  const [state, setState] = useState<Loadable<LiveAppRegistry>>(initialState);

  const updateManifests = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
    }));

    try {
      const allManifests = await api.fetchLiveAppManifests(provider);
      setState(() => ({
        isLoading: false,
        value: {
          liveAppByIndex: allManifests,
          liveAppById: allManifests.reduce((acc, liveAppManifest) => {
            acc[liveAppManifest.id] = liveAppManifest;
            return acc;
          }, {}),
        },
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

  const value: LiveAppContextType = useMemo(
    () => ({
      state,
      updateManifests,
    }),
    [state, updateManifests]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      updateManifests();
    }, updateFrequency);
    updateManifests();
    return () => {
      clearInterval(interval);
    };
  }, [updateFrequency, updateManifests]);

  return (
    <liveAppContext.Provider value={value}>{children}</liveAppContext.Provider>
  );
}
