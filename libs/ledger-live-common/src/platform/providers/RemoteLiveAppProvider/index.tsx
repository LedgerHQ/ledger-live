import React, { useContext, useEffect, createContext, useMemo, useState, useCallback } from "react";
import { LiveAppRegistry } from "./types";
import { AppPlatform, LiveAppManifest, Loadable } from "../../types";

import api from "./api";
import { FilterParams } from "../../filters";
import useIsMounted from "../../../hooks/useIsMounted";
import { AppManifest, Visibility } from "../../../wallet-api/types";
import useEnv from "@features/platform-env";

const initialState: Loadable<LiveAppRegistry> = {
  isLoading: false,
  value: null,
  error: null,
};

const initialProvider = "production";

const initialParams: FilterParams = {
  branches: ["stable", "soon"],
};

// A failed catalog fetch leaves every live app unresolvable ("App not found"),
// so it must not wait for the next scheduled refresh (30 min in the apps) to be
// retried. Typical cause: the device has no usable network yet at startup.
const RETRY_BASE_DELAY_MS = 2000;
const RETRY_MAX_DELAY_MS = 30000;
// ~90s of recovery window, then fall back to the regular refresh cadence so an
// offline device does not keep polling for the whole session.
const MAX_CONSECUTIVE_RETRIES = 6;

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

type FetchLiveAppCatalogPrams = {
  apiVersions?: string[];
  platform: AppPlatform;
  allowDebugApps: boolean;
  allowExperimentalApps: boolean;
  llVersion: string;
  lang?: string;
};

type LiveAppProviderProps = {
  children: React.ReactNode;
  parameters: FetchLiveAppCatalogPrams;
  updateFrequency: number;
};

export function useRemoteLiveAppManifest(appId?: string): LiveAppManifest | undefined {
  const liveAppRegistry = useContext(liveAppContext).state;

  if (!liveAppRegistry.value || !appId) {
    return undefined;
  }

  return (
    liveAppRegistry.value.liveAppFilteredById[appId] || liveAppRegistry.value.liveAppById[appId]
  );
}

export function useRemoteLiveAppContext(): LiveAppContextType {
  return useContext(liveAppContext);
}

export function useManifests(
  options: Partial<Omit<AppManifest, "visibility"> & { visibility: Visibility[] }> = {},
): AppManifest[] {
  const ctx = useRemoteLiveAppContext();

  return useMemo(() => {
    const liveAppFiltered = ctx.state?.value?.liveAppFiltered ?? [];
    if (Object.keys(options).length === 0) {
      return liveAppFiltered;
    }

    return liveAppFiltered.filter(manifest =>
      Object.entries(options).some(([key, val]) => {
        switch (key) {
          case "visibility":
            return (val as Visibility[]).includes(manifest[key]);
          default:
            return manifest[key] === val;
        }
      }),
    );
  }, [options, ctx]);
}

export function RemoteLiveAppProvider({
  children,
  parameters,
  updateFrequency,
}: LiveAppProviderProps): React.JSX.Element {
  const isMounted = useIsMounted();
  const [state, setState] = useState<Loadable<LiveAppRegistry>>(initialState);
  const [provider, setProvider] = useState<string>(initialProvider);

  const { allowExperimentalApps, allowDebugApps, apiVersions, platform, llVersion, lang } =
    parameters;

  // apiVersion renamed without (s) because param
  const apiVersion = apiVersions ? apiVersions : ["1.0.0", "2.0.0"];

  const envProviderURL = useEnv("PLATFORM_MANIFEST_API_URL");

  const providerURL = provider === "production" ? envProviderURL : provider;

  const fetchManifests = useCallback(async (): Promise<boolean> => {
    setState(currentState => ({
      ...currentState,
      isLoading: true,
      error: null,
    }));

    const branches = [...(initialParams.branches || [])];
    allowExperimentalApps && branches.push("experimental");
    allowDebugApps && branches.push("debug");

    const result = await api
      .fetchLiveAppManifests(providerURL)
      .then(allManifests =>
        api
          .fetchLiveAppManifests(providerURL, {
            apiVersion,
            branches,
            platform,
            private: false,
            llVersion,
            lang: lang ? lang : "en",
          })
          .then(catalogManifests => ({ allManifests, catalogManifests })),
      )
      .then(
        (manifests): { manifests: typeof manifests; fetchError: null } => ({
          manifests,
          fetchError: null,
        }),
        (e): { manifests: null; fetchError: unknown } => ({ manifests: null, fetchError: e }),
      );

    if (!isMounted()) return false;

    if (result.manifests === null) {
      // Keep any previously loaded catalog: a failed refresh must not wipe it.
      setState(currentState => ({
        ...currentState,
        isLoading: false,
        error: result.fetchError,
      }));
      return false;
    } else {
      const { allManifests, catalogManifests } = result.manifests;
      setState(() => ({
        isLoading: false,
        value: {
          liveAppByIndex: allManifests,
          liveAppFiltered: catalogManifests,
          liveAppFilteredById: catalogManifests.reduce((acc, liveAppManifest) => {
            acc[liveAppManifest.id] = liveAppManifest;
            return acc;
          }, {}),
          liveAppById: allManifests.reduce((acc, liveAppManifest) => {
            acc[liveAppManifest.id] = liveAppManifest;
            return acc;
          }, {}),
        },
        error: null,
      }));
      return true;
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [allowDebugApps, allowExperimentalApps, providerURL, lang, isMounted]);

  const updateManifests = useCallback(async () => {
    await fetchManifests();
  }, [fetchManifests]);

  const value: LiveAppContextType = useMemo(
    () => ({
      state,
      provider,
      setProvider,
      updateManifests,
    }),
    [state, provider, setProvider, updateManifests],
  );

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let failedAttempts = 0;

    const run = async () => {
      const succeeded = await fetchManifests();
      if (cancelled) return;
      if (succeeded) {
        failedAttempts = 0;
        return;
      }
      if (failedAttempts >= MAX_CONSECUTIVE_RETRIES) return;
      const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** failedAttempts, RETRY_MAX_DELAY_MS);
      failedAttempts += 1;
      retryTimeout = setTimeout(run, delay);
    };

    const interval = setInterval(run, updateFrequency);
    run();
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(retryTimeout);
    };
  }, [updateFrequency, fetchManifests]);

  return <liveAppContext.Provider value={value}>{children}</liveAppContext.Provider>;
}
