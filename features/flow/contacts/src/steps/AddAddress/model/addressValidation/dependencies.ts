import type {
  ContactsAddressValidationDependencies,
  ContactsAddressValidationGateway,
} from "./types";

export function createContactsAddressValidationDependencies(
  gateway: ContactsAddressValidationGateway,
): ContactsAddressValidationDependencies {
  return {
    findTokenById: gateway.findTokenById,
    supportsDomain: gateway.supportsDomain,
    isEnsDomain: async address => {
      const registries = await gateway.getRegistriesForDomain(address);
      return registries.some(registry => registry.name === "ens");
    },
    validateDomain: gateway.validateDomain,
    resolveEnsDomain: async address => {
      const [resolution] = await gateway.resolveDomain(address, "ens");
      return resolution?.address ?? null;
    },
    validateNetworkAddress: async ({ network, address }) => {
      const bridge = await gateway.getAccountBridgeByFamily(network.family);
      return bridge.validateAddress(address, { currencyId: network.id });
    },
  };
}
