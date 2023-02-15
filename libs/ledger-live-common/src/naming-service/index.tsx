import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isNameValid, isOutdated } from "./logic";
import { getAddressByName } from "./api";
import {
  NamingServiceContextAPI,
  NamingServiceContextState,
  NamingServiceContextType,
  NamingServiceStatus,
} from "./types";

const NamingServiceContext = createContext<NamingServiceContextType>({
  cache: {},
  loadNamingServiceAPI: () => Promise.resolve(),
  clearCache: () => {},
});

export const useNamingServiceAPI = (
  name: string | undefined
): NamingServiceStatus => {
  const { cache, loadNamingServiceAPI } = useContext(NamingServiceContext);
  const cachedData = name && cache[name];

  useEffect(() => {
    if (!name || !isNameValid(name)) return;
    if (!cachedData || isOutdated(cachedData)) {
      loadNamingServiceAPI(name);
    }
  }, [loadNamingServiceAPI, name, cachedData]);

  if (cachedData) {
    return cachedData;
  } else if (!isNameValid(name)) {
    return {
      status: "error",
      error: new Error("Invalid name format"),
      updatedAt: Date.now(),
    };
  } else {
    return { status: "queued" };
  }
};

type UseNamingServiceResponse =
  | { status: Exclude<NamingServiceStatus["status"], "loaded"> }
  | { status: "loaded"; address: string };

export function useNamingService(name: string): UseNamingServiceResponse {
  const data = useNamingServiceAPI(name);

  const { status } = data;
  const address = useMemo(
    () => (status === "loaded" ? data.address : null),
    [data, status]
  );

  return status !== "loaded"
    ? { status }
    : {
        status,
        address: address as string, // should always
      };
}

type NamingServiceProviderProps = {
  children: React.ReactNode;
};

export function NamingServiceProvider({
  children,
}: NamingServiceProviderProps): React.ReactElement {
  const [state, setState] = useState<NamingServiceContextState>({
    cache: {},
  });

  const api: NamingServiceContextAPI = useMemo(
    () => ({
      loadNamingServiceAPI: async (name: string) => {
        setState((oldState) => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [name]: {
              status: "loading",
            },
          },
        }));

        try {
          const address = await getAddressByName(name);
          setState((oldState) => ({
            ...oldState,
            cache: {
              ...oldState.cache,
              [name]: {
                status: "loaded",
                address,
                updatedAt: Date.now(),
              },
            },
          }));
        } catch (error) {
          setState((oldState) => ({
            ...oldState,
            cache: {
              ...oldState.cache,
              [name]: {
                status: "error",
                error,
                updatedAt: Date.now(),
              },
            },
          }));
        }
      },
      clearCache: () => {
        setState((oldState) => ({
          ...oldState,
          cache: {},
        }));
      },
    }),
    []
  );

  const value = { ...state, ...api };

  return (
    <NamingServiceContext.Provider value={value}>
      {children}
    </NamingServiceContext.Provider>
  );
}
