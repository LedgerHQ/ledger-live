import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { resolveAddress, resolveDomain } from "../resolvers";
import { SupportedRegistries } from "../types";
import { isOutdated } from "./logic";
import {
  DomainServiceContextAPI,
  DomainServiceContextState,
  DomainServiceContextType,
  DomainServiceStatus,
} from "./types";

const DomainServiceContext = createContext<DomainServiceContextType>({
  cache: {},
  loadDomainServiceAPI: () => Promise.resolve(),
  clearCache: () => {},
});

export const useDomain = (
  addressOrDomain: string,
  registry?: SupportedRegistries
): DomainServiceStatus => {
  const addressOrDomainLC = addressOrDomain.toLowerCase();
  const { cache, loadDomainServiceAPI } = useContext(DomainServiceContext);
  const cachedData = addressOrDomain && cache[addressOrDomainLC];

  useEffect(() => {
    if (!cachedData || isOutdated(cachedData)) {
      loadDomainServiceAPI(addressOrDomainLC, registry);
    }
  }, [loadDomainServiceAPI, addressOrDomainLC, cachedData]);

  if (cachedData) {
    return cachedData;
  } else if (!addressOrDomain) {
    return {
      status: "error",
      error: new Error("No address or domain provided"),
      updatedAt: Date.now(),
    };
  }
  return { status: "queued" };
};

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
      loadDomainServiceAPI: async (
        addressOrDomain: string,
        registry?: SupportedRegistries
      ) => {
        setState((oldState) => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [addressOrDomain]: {
              status: "loading",
            },
          },
        }));

        try {
          const resolutions = await Promise.all([
            resolveDomain(addressOrDomain, registry),
            resolveAddress(addressOrDomain, registry),
          ]).then((res) => res.flat());

          if (resolutions.length) {
            setState((oldState) => ({
              ...oldState,
              cache: {
                ...oldState.cache,
                [addressOrDomain]: {
                  status: "loaded",
                  resolutions,
                  updatedAt: Date.now(),
                },
              },
            }));

            return;
          }

          throw new Error("no resolution for " + addressOrDomain);
        } catch (error) {
          setState((oldState) => ({
            ...oldState,
            cache: {
              ...oldState.cache,
              [addressOrDomain]: {
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
