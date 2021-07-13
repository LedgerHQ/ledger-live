// @flow

import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useContext,
} from "react";
import type { PlatformAppContextType, Props, State } from "./types";
import api from "./api";
import { mergeManifestLists } from "./helpers";

//$FlowFixMe
const PlatformAppContext = createContext<PlatformAppContextType>({});

const initialState: State = {
  manifests: [],
  manifestById: {},
  isLoading: false,
  lastUpdateTime: undefined,
  error: undefined,
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

export function usePlatformApp(): PlatformAppContextType {
  return useContext(PlatformAppContext);
}

export function PlatformAppProvider({
  autoUpdateDelay,
  extraManifests,
  children,
}: Props) {
  const [state, setState] = useState<State>(initialState);

  const updateData = useCallback(async () => {
    try {
      setState((previousState) => ({
        ...previousState,
        isLoading: true,
      }));
      const manifests = await api.fetchManifest();
      const allManifests = extraManifests
        ? mergeManifestLists(manifests, extraManifests)
        : manifests;
      setState((previousState) => ({
        ...previousState,
        manifests: allManifests,
        manifestById: allManifests.reduce((acc, manifest) => {
          acc[manifest.id] = manifest;
          return acc;
        }, {}),
        isLoading: false,
        lastUpdateTime: Date.now(),
        error: undefined,
      }));
    } catch (error) {
      setState((previousState) => ({
        ...previousState,
        isLoading: false,
        error,
      }));
    }
  }, [extraManifests]);

  useEffect(() => {
    updateData();
  }, [updateData]);

  useEffect(() => {
    const intervalInstance = setInterval(
      updateData,
      autoUpdateDelay !== undefined
        ? autoUpdateDelay
        : AUTO_UPDATE_DEFAULT_DELAY
    );
    return () => clearInterval(intervalInstance);
  }, [autoUpdateDelay, updateData]);

  const value = useMemo(
    () => ({
      ...state,
      updateData,
    }),
    [state, updateData]
  );

  return (
    <PlatformAppContext.Provider value={value}>
      {children}
    </PlatformAppContext.Provider>
  );
}
