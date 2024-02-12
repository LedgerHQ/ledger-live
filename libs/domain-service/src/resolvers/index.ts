import axios from "axios";
import eip55 from "eip55";
import { log } from "@ledgerhq/logs";
import { DomainServiceResolution, SupportedRegistries } from "../types";
import { allSettled } from "../utils";
import { getRegistries, getRegistriesForAddress, getRegistriesForDomain } from "../registries";

/**
 * Get an array of addresses for a domain
 *
 * @param {string} domain
 * @returns {Promise<DomainServiceResolution[]>}
 */
export const resolveDomain = async (
  domain: string,
  registryName?: SupportedRegistries,
): Promise<DomainServiceResolution[]> => {
  const registries = await (async () => {
    if (registryName) {
      const registries = await getRegistries();
      const registry = registries.find(
        r => r.name === registryName && r.patterns.forward.test(domain),
      );
      return registry
        ? [registry]
        : /* istanbul ignore next: don't test emptiness of resolutions */ [];
    }
    return getRegistriesForDomain(domain);
  })();

  const responses = allSettled(
    registries.map(registry =>
      axios.request<string>({
        method: "GET",
        url: registry.resolvers.forward.replace("{name}", domain),
      }),
    ),
  );

  return responses.then(promises =>
    promises.reduce((result, promise, index) => {
      if (promise.status !== "fulfilled") {
        // ignore 404 error
        /* istanbul ignore next: don't test logs */
        if (axios.isAxiosError(promise.reason) && promise.reason.response?.status !== 404) {
          log("domain-service", "failed to resolve a domain", {
            domain,
            error: promise.reason,
          });
        }
        return result;
      }

      if (!promise.value.data) return result;

      const checksummedAddress = (() => {
        try {
          return eip55.encode(promise.value.data);
        } catch (e) {
          return promise.value.data;
        }
      })();

      result.push({
        registry: registries[index].name,
        address: checksummedAddress,
        domain,
        type: "forward",
      });
      return result;
    }, [] as DomainServiceResolution[]),
  );
};

/**
 * Get an array of domains for an address
 *
 * @param {string} address
 * @returns {Promise<DomainServiceResolution[]>}
 */
export const resolveAddress = async (
  address: string,
  registryName?: SupportedRegistries,
): Promise<DomainServiceResolution[]> => {
  const registries = await (async () => {
    if (registryName) {
      const registries = await getRegistries();
      const registry = registries.find(
        r => r.name === registryName && r.patterns.reverse.test(address),
      );
      return registry
        ? [registry]
        : /* istanbul ignore next: don't test emptiness of resolutions */ [];
    }
    return getRegistriesForAddress(address);
  })();

  const checksummedAddress = (() => {
    try {
      return eip55.encode(address);
    } catch (e) {
      return address;
    }
  })();

  const responses = allSettled(
    registries.map(registry =>
      axios.request<string>({
        method: "GET",
        url: registry.resolvers.reverse.replace("{address}", address),
      }),
    ),
  );

  return responses.then(promises =>
    promises.reduce((result, promise, index) => {
      if (promise.status !== "fulfilled") {
        // ignore 404 error
        /* istanbul ignore next: don't test logs */
        if (axios.isAxiosError(promise.reason) && promise.reason.response?.status !== 404) {
          log("domain-service", "failed to resolve a address", {
            address,
            error: promise.reason,
          });
        }
        return result;
      }

      if (!promise.value.data) return result;

      result.push({
        registry: registries[index].name,
        domain: promise.value.data,
        address: checksummedAddress,
        type: "reverse",
      });
      return result;
    }, [] as DomainServiceResolution[]),
  );
};
