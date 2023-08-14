import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveAddress, resolveDomain } from "../resolvers";
import { getRegistriesForAddress } from "../registries";
import { getRegistriesForDomain } from "../registries";
import { SupportedRegistries } from "../types";
import { validateDomain } from "../utils";
import { isOutdated } from "./logic";
import {
  DomainServiceContextAPI,
  DomainServiceContextState,
  DomainServiceContextType,
  DomainServiceStatus,
} from "./types";
import { DomainEmpty, InvalidDomain, NoResolution, UnsupportedDomainOrAddress } from "../errors";

const DomainServiceContext = createContext<DomainServiceContextType>({
  cache: {},
  loadDomainServiceAPI: () => Promise.resolve(),
  clearCache:
    /* istanbul ignore next: don't test default state because it's gonna be overriden */ () => {},
});

export const useDomain = (
  addressOrDomain: string,
  registry?: SupportedRegistries,
): DomainServiceStatus => {
  const [state, setState] = useState<DomainServiceStatus>({ status: "queued" });
  const addressOrDomainLC = addressOrDomain.toLowerCase();
  const { cache, loadDomainServiceAPI } = useContext(DomainServiceContext);
  const cachedData = addressOrDomain && cache[addressOrDomainLC];

  useEffect(() => {
    (async () => {
      // serve data from the context API
      if (cachedData && !isOutdated(cachedData)) return;

      // no input
      if (!addressOrDomainLC) {
        setState({
          status: "error",
          error: new DomainEmpty(),
          updatedAt: Date.now(),
        });
        return;
      }

      // checking if any registry is compatible with the provided string
      const [forwardRegistries, reverseRegistries] = await Promise.all([
        getRegistriesForDomain(addressOrDomainLC),
        getRegistriesForAddress(addressOrDomainLC),
      ]);

      // if no registry is found at all
      if (!forwardRegistries.length && !reverseRegistries.length) {
        setState({
          status: "error",
          error: new UnsupportedDomainOrAddress(),
          updatedAt: Date.now(),
        });
        return;
      }

      // if it's a domain but the domain is not respecting our security rules
      if (forwardRegistries.length && !validateDomain(addressOrDomainLC)) {
        setState({
          status: "error",
          error: new InvalidDomain(),
          updatedAt: Date.now(),
        });
        return;
      }

      // otherwise let the resolution happen by the backend
      await loadDomainServiceAPI(addressOrDomainLC, registry);
    })();
  }, [loadDomainServiceAPI, addressOrDomainLC, cachedData]);

  if (cachedData) {
    return cachedData;
  }
  return state;
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
      loadDomainServiceAPI: async (addressOrDomain: string, registry?: SupportedRegistries) => {
        setState(oldState => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [addressOrDomain]: {
              status: "loading",
            },
          },
        }));

        const resolutions = await Promise.all([
          resolveDomain(addressOrDomain, registry),
          resolveAddress(addressOrDomain, registry),
        ])
          .then(res => res.flat())
          .catch((e: Error) => e);

        const newEntry = (() => {
          if (Array.isArray(resolutions)) {
            return resolutions.length
              ? {
                  status: "loaded" as const,
                  resolutions,
                  updatedAt: Date.now(),
                }
              : {
                  status: "error" as const,
                  error: new NoResolution(`No resolution found for ${addressOrDomain}`),
                  updatedAt: Date.now(),
                };
          }
          return {
            status: "error" as const,
            error: resolutions,
            updatedAt: Date.now(),
          };
        })();

        setState(oldState => ({
          ...oldState,
          cache: {
            ...oldState.cache,
            [addressOrDomain]: newEntry,
          },
        }));
      },
      clearCache: () => {
        setState(oldState => ({
          ...oldState,
          cache: {},
        }));
      },
    }),
    [],
  );

  const value = { ...state, ...api };

  return <DomainServiceContext.Provider value={value}>{children}</DomainServiceContext.Provider>;
}
