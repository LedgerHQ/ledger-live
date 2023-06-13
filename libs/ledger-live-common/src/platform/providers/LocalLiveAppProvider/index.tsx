import React, {
  useContext,
  createContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { LiveAppRegistry } from "./types";
import { LiveAppManifest } from "../../types";
import { getEnv } from "../../../env";

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
  localLiveAppManifest?: LiveAppManifest;
};

export function useLocalLiveAppManifest(
  appId?: string
): LiveAppManifest | undefined {
  const localLiveAppRegistry = useContext(liveAppContext).state;

  return appId ? localLiveAppRegistry.liveAppById[appId] : undefined;
}

export function useLocalLiveAppContext(): LiveAppContextType {
  return useContext(liveAppContext);
}

export function LocalLiveAppProvider({
  children,
}: // localLiveAppManifest,
LiveAppProviderProps): JSX.Element {
  const [state, setState] = useState<LiveAppRegistry>(initialState);

  console.log("THE LOCAL LIVE APP PROVIDER HAS BEEN LOADED OMGGGGG");

  const addLocalManifest = useCallback((newManifest: LiveAppManifest) => {
    // eslint-disable-next-line no-console
    console.log("WE ARE IN ADD LOCAL MANIFEST");
    setState((oldState) => {
      // eslint-disable-next-line no-console
      console.log("Here we go: ADDING MANIFEST", newManifest);
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

  // const mockedState: LiveAppRegistry = getEnv("MOCK") &&
  //   localLiveAppManifest && {
  //     liveAppById: {
  //       [localLiveAppManifest.id]: localLiveAppManifest,
  //     },
  //     liveAppByIndex: [localLiveAppManifest],
  //   };

  const value: LiveAppContextType = useMemo(
    () => ({
      state,
      addLocalManifest,
      removeLocalManifestById,
    }),
    [state, addLocalManifest, removeLocalManifestById]
  );

  // const mockedValue: LiveAppContextType = useMemo(
  //   () => ({
  //     mockedState,
  //     addLocalManifest,
  //     removeLocalManifestById,
  //   }),
  //   [mockedState, addLocalManifest, removeLocalManifestById]
  // );

  return (
    <liveAppContext.Provider value={value}>{children}</liveAppContext.Provider>
  );
}
