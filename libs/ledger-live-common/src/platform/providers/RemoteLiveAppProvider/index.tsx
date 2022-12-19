import React, {
  useContext,
  useEffect,
  createContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { LiveAppRegistry } from "./types";
import { LiveAppManifest, Loadable } from "../../types";

import api from "./api";
import { FilterParams } from "../../filters";
import { getEnv } from "../../../env";

const initialState: Loadable<LiveAppRegistry> = {
  isLoading: false,
  value: null,
  error: null,
};

const initialProvider = "production";

const initialParams: FilterParams = {
  branches: ["stable", "soon"],
};

type LiveAppContextType = {
  state: Loadable<LiveAppRegistry>;
  provider: string;
  setProvider: React.Dispatch<React.SetStateAction<string>>;
  updateManifests: () => Promise<void>;
};

export const liveAppContext = createContext<LiveAppContextType>({
  state: initialState,
  provider: initialProvider,
  setProvider: () => {},
  updateManifests: () => Promise.resolve(),
});

type FetchLiveAppCatalogPrams = Required<
  Omit<FilterParams, "branches" | "private">
> &
  Pick<FilterParams, "private"> & {
    allowDebugApps: boolean;
    allowExperimentalApps: boolean;
  };

type LiveAppProviderProps = {
  children: React.ReactNode;
  parameters: FetchLiveAppCatalogPrams;
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
  parameters,
  updateFrequency,
}: LiveAppProviderProps): JSX.Element {
  const [state, setState] = useState<Loadable<LiveAppRegistry>>(initialState);
  const [provider, setProvider] = useState<string>(initialProvider);

  const { allowExperimentalApps, allowDebugApps, ...params } = parameters;

  const providerURL: string =
    provider === "production" ? getEnv("PLATFORM_MANIFEST_API_URL") : provider;

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
      const allManifests = await api.fetchLiveAppManifests(providerURL, {
        ...params,
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
  }, [allowDebugApps, allowExperimentalApps, providerURL]);

  const value: LiveAppContextType = useMemo(
    () => ({
      state,
      provider,
      setProvider,
      updateManifests,
    }),
    [state, provider, setProvider, updateManifests]
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
