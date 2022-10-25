import React, {
  useContext,
  createContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { LiveAppRegistry } from "./types";
import { LiveAppManifest } from "../types";

const initialState: LiveAppRegistry = {
  liveAppById: {},
  liveAppByIndex: [],
};

type LiveAppContextType = {
  state: LiveAppRegistry;
  addLocalManifest: (LiveAppManifest) => void;
  removeLocalManifestById: (string) => void;
};

export const liveAppContext = createContext<LiveAppContextType>({
  state: initialState,
  addLocalManifest: () => {},
  removeLocalManifestById: () => {},
});

type LiveAppProviderProps = {
  children: React.ReactNode;
};

export function useLocalLiveAppManifest(
  appId: string
): LiveAppManifest | undefined {
  const localLiveAppRegistry = useContext(liveAppContext).state;

  return localLiveAppRegistry.liveAppById[appId];
}

export function useLocalLiveAppContext(): LiveAppContextType {
  return useContext(liveAppContext);
}

export function LocalLiveAppProvider({
  children,
}: LiveAppProviderProps): JSX.Element {
  const [state, setState] = useState<LiveAppRegistry>(initialState);

  const addLocalManifest = useCallback((newManifest: LiveAppManifest) => {
    setState((oldState) => {
      const liveAppByIndex = oldState.liveAppByIndex.filter(
        (manifest) => manifest.id !== newManifest.id
      );

      liveAppByIndex.push(newManifest);
      return {
        liveAppById: {
          ...oldState.liveAppById,
          [newManifest.id]: newManifest,
        },
        liveAppByIndex,
      };
    });
  }, []);

  const removeLocalManifestById = useCallback((manifestId: string) => {
    setState((oldState) => {
      const liveAppByIndex = oldState.liveAppByIndex.filter(
        (manifest) => manifest.id !== manifestId
      );

      const liveAppById = {
        ...oldState.liveAppById,
      };

      delete liveAppById[manifestId];

      return {
        liveAppById,
        liveAppByIndex,
      };
    });
  }, []);

  const value: LiveAppContextType = useMemo(
    () => ({
      state,
      addLocalManifest,
      removeLocalManifestById,
    }),
    [state, addLocalManifest, removeLocalManifestById]
  );

  return (
    <liveAppContext.Provider value={value}>{children}</liveAppContext.Provider>
  );
}
