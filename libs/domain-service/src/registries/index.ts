import { Registry } from "../types";

const REGISTRIES: Registry[] = [
  {
    name: "ens",
    resolvers: {
      forward:
        "https://explorers.api.live.ledger.com/blockchain/v4/eth/ens/resolve/{name}",
      reverse:
        "https://explorers.api.live.ledger.com/blockchain/v4/eth/ens/reverse-resolve/{address}",
    },
    signatures: {
      forward:
        "https://nft.api.live.ledger.com/v1/names/ens/forward/{name}?challenge={challenge}",
      reverse:
        "https://nft.api.live.ledger.com/v1/names/ens/reverse/{address}?challenge={challenge}",
    },
    patterns: {
      forward: new RegExp(".eth$"),
      reverse: new RegExp("^0x[0-9a-fA-F]{40}$"),
    },
    coinTypes: [60],
  },
];

/**
 * Method is voluntarly made async so it can be replaced by a backend call once implemented
 */
export const getRegistries = async (): Promise<Registry[]> => REGISTRIES;

/**
 * Get an array of registries compatible with a given domain
 *
 * @param {string} domain
 * @returns {Promise<AddressResolutionResponse[]>}
 */
export const getRegistriesForDomain = async (
  domain: string
): Promise<Registry[]> => {
  const registries = await getRegistries();

  return registries.filter((registry) =>
    registry.patterns.forward.test(domain)
  );
};

/**
 * Get an array of registries compatible with a given address
 *
 * @param {string} address
 * @returns {Promise<AddressResolutionResponse[]>}
 */
export const getRegistriesForAddress = async (
  address: string
): Promise<Registry[]> => {
  const registries = await getRegistries();

  return registries.filter((registry) =>
    registry.patterns.reverse.test(address)
  );
};
