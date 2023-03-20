import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-common/network";
import { SupportedRegistries } from "../types";
import { getRegistries } from "../registries";

/**
 * Get an APDU to sign a domain resolution on the nano
 *
 * @param {string} domain
 * @param {SupportedRegistries} registryName
 * @param {string} challenge
 * @returns {Promise<AddressResolutionResponse[]>}
 */
export const signDomainResolution = async (
  domain: string,
  registryName: SupportedRegistries,
  challenge: string
): Promise<string | null> => {
  const registries = await getRegistries();
  const registry = registries.find((r) => r.name === registryName);
  if (!registry) return null;

  const url = registry.signatures.forward
    .replace("{name}", domain)
    .replace("{challenge}", challenge);

  return network<{ payload: string }>({
    method: "GET",
    url,
  })
    .then(({ data }) => data.payload)
    .catch((error) => {
      if (error.status !== 404) {
        log("domain-service", "failed to get APDU for a domain", {
          domain,
          error,
        });
      }
      return null;
    });
};

/**
 * Get an APDU to sign an address resolve resolution on the nano
 *
 * @param {string} address
 * @param {SupportedRegistries} registryName
 * @param {string} challenge
 * @returns {Promise<AddressResolutionResponse[]>}
 */
export const signAddressResolution = async (
  address: string,
  registryName: SupportedRegistries,
  challenge: string
): Promise<string | null> => {
  const registries = await getRegistries();
  const registry = registries.find((r) => r.name === registryName);
  if (!registry) return null;

  const url = registry.signatures.reverse
    .replace("{address}", address)
    .replace("{challenge}", challenge);

  return network<{ payload: string }>({
    method: "GET",
    url,
  })
    .then(({ data }) => data.payload)
    .catch((error) => {
      if (error.status !== 404) {
        log("domain-service", "failed to get APDU for an address", {
          address,
          error,
        });
      }
      return null;
    });
};
