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

export function LocalLiveAppProvider({ children, db }: LiveAppProviderProps): React.JSX.Element {
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

  // Type assertion: mixed @types/react (18 vs 19) in deps make Provider's children type incompatible with our ReactNode.
  return (
    <liveAppContext.Provider value={value}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children as any}
    </liveAppContext.Provider>
  );
}

export function useLocalLiveAppManifest(appId?: string): LiveAppManifest | undefined {
  const getLocalLiveAppManifestById = useContext(liveAppContext).getLocalLiveAppManifestById;

  return appId ? getLocalLiveAppManifestById(appId) : undefined;
}

export function useLocalLiveAppContext(): LiveAppContextType {
  return useContext(liveAppContext);
}
