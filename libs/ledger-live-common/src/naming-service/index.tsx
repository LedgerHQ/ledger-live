import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAddressByName, getNameByAddress } from "./api";
import { isEthereumAddress, isNameValid, isOutdated } from "./logic";
import {
  NamingServiceContextAPI,
  NamingServiceContextState,
  NamingServiceContextType,
  NamingServiceStatus,
  UseNamingServiceResponse,
} from "./types";

export const VALID_DOMAINS = [".eth"];

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
    if (!name || (!isNameValid(name) && !isEthereumAddress(name))) return;
    if (!cachedData || isOutdated(cachedData)) {
      loadNamingServiceAPI(name);
    }
  }, [loadNamingServiceAPI, name, cachedData]);

  if (cachedData) {
    return cachedData;
  } else if (
    (!isNameValid(name) && name && !isEthereumAddress(name)) ||
    !name
  ) {
    return {
      status: "error",
      error: new Error("Invalid name format"),
      updatedAt: Date.now(),
    };
  } else {
    return { status: "queued" };
  }
};

export function useNamingService(name: string): UseNamingServiceResponse {
  const data = useNamingServiceAPI(name);

  const { status } = data;
  const loadedData = useMemo(
    () => (status === "loaded" ? data : null),
    [data, status]
  );

  return loadedData && status === "loaded"
    ? {
        status: "loaded",
        address: loadedData.address,
        name: loadedData.name,
        type: loadedData.type,
      }
    : ({ status } as {
        status: Exclude<UseNamingServiceResponse["status"], "loaded">;
      });
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
      loadNamingServiceAPI: async (str: string) => {
        setState((oldState) => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [str]: {
              status: "loading",
            },
          },
        }));

        try {
          let result: string;
          if (isNameValid(str)) {
            result = await getAddressByName(str);
            setState((oldState) => ({
              ...oldState,
              cache: {
                ...oldState.cache,
                [str]: {
                  status: "loaded",
                  address: result,
                  name: str,
                  type: "forward",
                  updatedAt: Date.now(),
                },
              },
            }));
          } else {
            result = await getNameByAddress(str);
            setState((oldState) => ({
              ...oldState,
              cache: {
                ...oldState.cache,
                [str]: {
                  status: "loaded",
                  address: str,
                  name: result,
                  type: "reverse",
                  updatedAt: Date.now(),
                },
              },
            }));
          }
        } catch (error) {
          setState((oldState) => ({
            ...oldState,
            cache: {
              ...oldState.cache,
              [str]: {
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
