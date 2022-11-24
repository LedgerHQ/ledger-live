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
import { FilterParams } from "../../filters";

const initialState: Loadable<LiveAppRegistry> = {
  isLoading: false,
  value: null,
  error: null,
};

const initialParams: FilterParams = {
  branches: ["stable", "soon"],
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
  branchesParams: { allowDebugApps: boolean; allowExperimentalApps: boolean };
  updateFrequency: number;
};

export function useRemoteLiveAppManifest(
  appId?: string
): LiveAppManifest | undefined {
  const liveAppRegistry = useContext(liveAppContext).state;

  if (!liveAppRegistry.value || !appId) {
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
  branchesParams,
  updateFrequency,
}: LiveAppProviderProps): JSX.Element {
  const [state, setState] = useState<Loadable<LiveAppRegistry>>(initialState);
  const { allowExperimentalApps, allowDebugApps } = branchesParams;

  const updateManifests = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      error: null,
    }));

    const branches = [...(initialParams.branches || [])];
    allowExperimentalApps && branches.push("experimental");
    allowDebugApps && branches.push("debug");

    try {
      const allManifests = await api.fetchLiveAppManifests(provider, {
        branches,
      });

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
  }, [branchesParams, provider]);

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
