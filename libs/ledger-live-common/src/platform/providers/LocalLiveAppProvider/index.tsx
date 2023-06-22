import React, {
  useContext,
  createContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { LiveAppRegistry } from "./types";
import { LiveAppManifest } from "../../types";
import { Subject } from "rxjs";

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

type MockSubjectData =
  | {
      type: "add";
      payload: { id: string; name: string; serviceUUID: string };
    }
  | { type: "openNano" }
  | {
      type: "loadLocalManifest";
      payload: LiveAppManifest;
    };

type LiveAppProviderProps = {
  children: React.ReactNode;
  mockModeObserver?: Subject<MockSubjectData>;
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
  mockModeObserver,
}: LiveAppProviderProps): JSX.Element {
  const [state, setState] = useState<LiveAppRegistry>(initialState);

  console.log("local live app provdier loaded");

  if (mockModeObserver) {
    console.log("IN THE PLATFORM APP PROVIDER WRAPPER");

    mockModeObserver.subscribe((message) => {
      if (message.type === "loadLocalManifest") {
        // setMockedLocalLiveAppState([
        //   ...mockedLocalLiveAppState,
        //   message.payload,
        // ]);
        // eslint-disable-next-line no-console
        console.log(
          "Manifest to add:",
          JSON.stringify(message.payload, null, 2)
        );
        addLocalManifest(message.payload);

        // setTimeout(() => {
        //   setKey(key + 1);
        //   // eslint-disable-next-line no-console
        //   console.log(liveAppContext.state);
        // }, 100);
      }
    });
  }

  const addLocalManifest = useCallback((newManifest: LiveAppManifest) => {
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
