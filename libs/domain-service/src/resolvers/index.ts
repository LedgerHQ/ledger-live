import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-common/network";
import { SupportedRegistries } from "../types";
import {
  getRegistries,
  getRegistriesForAddress,
  getRegistriesForDomain,
} from "../registries";

type DomainResolutionResponse = {
  registry: SupportedRegistries;
  address: string;
};

/**
 * Get an array of addresses for a domain
 *
 * @param {string} domain
 * @returns {Promise<DomainResolutionResponse[]>}
 */
export const resolveDomain = async (
  domain: string,
  registryName?: SupportedRegistries
): Promise<DomainResolutionResponse[]> => {
  const registries = await (async () => {
    if (registryName) {
      const registries = await getRegistries();
      const registry = registries.find((r) => r.name === registryName);
      return registry ? [registry] : [];
    }
    return getRegistriesForDomain(domain);
  })();

  const responses = Promise.allSettled(
    registries.map((registry) =>
      network<string>({
        method: "GET",
        url: registry.resolvers.forward.replace("{name}", domain),
      })
    )
  );

  return responses.then((promises) =>
    promises.reduce((result, promise, index) => {
      if (promise.status !== "fulfilled") {
        // ignore 404 error
        if (promise.reason.response.status !== 404) {
          log("domain-service", "failed to resolve a domain", {
            domain,
            error: promise.reason,
          });
        }
        return result;
      }

      result.push({
        registry: registries[index].name,
        address: promise.value.data,
      });
      return result;
    }, [] as DomainResolutionResponse[])
  );
};

type AddressResolutionResponse = {
  registry: SupportedRegistries;
  domain: string;
};

/**
 * Get an array of domains for an address
 *
 * @param {string} address
 * @returns {Promise<AddressResolutionResponse[]>}
 */
export const resolveAddress = async (
  address: string,
  registryName?: SupportedRegistries
): Promise<AddressResolutionResponse[]> => {
  const registries = await (async () => {
    if (registryName) {
      const registries = await getRegistries();
      const registry = registries.find((r) => r.name === registryName);
      return registry ? [registry] : [];
    }
    return getRegistriesForAddress(address);
  })();

  const responses = Promise.allSettled(
    registries.map((registry) =>
      network<string>({
        method: "GET",
        url: registry.resolvers.reverse.replace("{address}", address),
      })
    )
  );

  return responses.then((promises) =>
    promises.reduce((result, promise, index) => {
      if (promise.status !== "fulfilled") {
        // ignore 404 error
        if (promise.reason.response.status !== 404) {
          log("domain-service", "failed to resolve a address", {
            address,
            error: promise.reason,
          });
        }
        return result;
      }

      result.push({
        registry: registries[index].name,
        domain: promise.value.data,
      });
      return result;
    }, [] as AddressResolutionResponse[])
  );
};
