import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { resolveAddress, resolveDomain } from "../resolvers";
import { isOutdated } from "./logic";
import {
  DomainServiceContextAPI,
  DomainServiceContextState,
  DomainServiceContextType,
  DomainServiceStatus,
  UseDomainServiceResponse,
} from "./types";

const DomainServiceContext = createContext<DomainServiceContextType>({
  cache: {},
  loadDomainServiceAPI: () => Promise.resolve(),
  clearCache: () => {},
});

export const useDomainServiceAPI = (
  name: string | undefined
): DomainServiceStatus => {
  const { cache, loadDomainServiceAPI } = useContext(DomainServiceContext);
  const cachedData = name && cache[name];

  useEffect(() => {
    if (!name) return;
    if (!cachedData || isOutdated(cachedData)) {
      loadDomainServiceAPI(name);
    }
  }, [loadDomainServiceAPI, name, cachedData]);

  if (cachedData) {
    return cachedData;
  } else if (!name) {
    return {
      status: "error",
      error: new Error("Invalid name format"),
      updatedAt: Date.now(),
    };
  } else {
    return { status: "queued" };
  }
};

export function useDomainService(name: string): UseDomainServiceResponse {
  const data = useDomainServiceAPI(name);

  const { status } = data;
  const loadedData = useMemo(
    () => (status === "loaded" ? data : null),
    [data, status]
  );

  return loadedData && status === "loaded"
    ? {
        status: "loaded",
        address: loadedData.address,
        domain: loadedData.domain,
        type: loadedData.type,
      }
    : ({ status } as {
        status: Exclude<UseDomainServiceResponse["status"], "loaded">;
      });
}

type DomainServiceProviderProps = {
  children: React.ReactNode;
};

export function DomainServiceProvider({
  children,
}: DomainServiceProviderProps): React.ReactElement {
  const [state, setState] = useState<DomainServiceContextState>({
    cache: {},
  });

  const api: DomainServiceContextAPI = useMemo(
    () => ({
      loadDomainServiceAPI: async (str: string) => {
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
          const resolvedDomain = await resolveDomain(str);
          if (resolvedDomain.length > 0) {
            setState((oldState) => ({
              ...oldState,
              cache: {
                ...oldState.cache,
                [str]: {
                  status: "loaded",
                  address: resolvedDomain[0].address,
                  domain: str,
                  type: "forward",
                  updatedAt: Date.now(),
                },
              },
            }));

            return;
          }

          const resolvedAddress = await resolveAddress(str);
          if (resolvedAddress.length > 0) {
            setState((oldState) => ({
              ...oldState,
              cache: {
                ...oldState.cache,
                [str]: {
                  status: "loaded",
                  address: str,
                  domain: resolvedAddress[0].domain,
                  type: "reverse",
                  updatedAt: Date.now(),
                },
              },
            }));

            return;
          }

          throw new Error("no resolve for " + str);
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
    <DomainServiceContext.Provider value={value}>
      {children}
    </DomainServiceContext.Provider>
  );
}
