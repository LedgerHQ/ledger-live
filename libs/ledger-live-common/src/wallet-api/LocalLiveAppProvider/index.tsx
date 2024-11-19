import React, { useContext, createContext, useMemo } from "react";
import { LiveAppProviderProps, LiveAppContextType } from "./types";
import { LiveAppManifest } from "../../platform/types";
import { useLocalLiveApp } from "../react";

const initialState: LiveAppManifest[] = [];

export const liveAppContext = createContext<LiveAppContextType>({
  state: initialState,
  addLocalManifest: () => {},
  removeLocalManifestById: () => {},
  getLocalLiveAppManifestById: id => id,
});

export function LocalLiveAppProvider({ children, db }: LiveAppProviderProps): JSX.Element {
  const { state, addLocalManifest, removeLocalManifestById, getLocalLiveAppManifestById } =
    useLocalLiveApp(db);

  const value: LiveAppContextType = useMemo(
    () => ({
      state,
      addLocalManifest,
      removeLocalManifestById,
      getLocalLiveAppManifestById,
    }),
    [state, addLocalManifest, removeLocalManifestById, getLocalLiveAppManifestById],
  );

  return <liveAppContext.Provider value={value}>{children}</liveAppContext.Provider>;
}

export function useLocalLiveAppManifest(appId?: string): LiveAppManifest | undefined {
  const getLocalLiveAppManifestById = useContext(liveAppContext).getLocalLiveAppManifestById;

  return appId ? getLocalLiveAppManifestById(appId) : undefined;
}

export function useLocalLiveAppContext(): LiveAppContextType {
  return useContext(liveAppContext);
}
