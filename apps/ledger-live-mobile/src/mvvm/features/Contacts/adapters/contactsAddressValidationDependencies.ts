import { getRegistriesForDomain } from "@ledgerhq/domain-service/registries/index";
import { resolveDomain } from "@ledgerhq/domain-service/resolvers/index";
import { validateDomain } from "@ledgerhq/domain-service/utils/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getAccountBridgeByFamily } from "@ledgerhq/live-common/bridge/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { ContactsAddressValidationDependencies } from "@features/flow-contacts";

export type ContactsAddressValidationMobileDependencies = Readonly<{
  findTokenById: ReturnType<typeof getCryptoAssetsStore>["findTokenById"];
  getAccountBridgeByFamily: typeof getAccountBridgeByFamily;
  supportsDomain: typeof sendFeatures.supportsDomain;
  getRegistriesForDomain(address: string): Promise<readonly { name: string }[]>;
  resolveDomain(address: string, registry: "ens"): Promise<readonly { address: string }[]>;
  validateDomain: typeof validateDomain;
}>;

const DEFAULT_MOBILE_DEPENDENCIES: ContactsAddressValidationMobileDependencies = {
  findTokenById: currencyId => getCryptoAssetsStore().findTokenById(currencyId),
  getAccountBridgeByFamily,
  supportsDomain: sendFeatures.supportsDomain,
  getRegistriesForDomain,
  resolveDomain,
  validateDomain,
};

export function createContactsAddressValidationDependencies(
  dependencies: ContactsAddressValidationMobileDependencies = DEFAULT_MOBILE_DEPENDENCIES,
): ContactsAddressValidationDependencies {
  return {
    findTokenById: dependencies.findTokenById,
    supportsDomain: dependencies.supportsDomain,
    isEnsDomain: async address => {
      const registries = await dependencies.getRegistriesForDomain(address);
      return registries.some(registry => registry.name === "ens");
    },
    validateDomain: dependencies.validateDomain,
    resolveEnsDomain: async address => {
      const [resolution] = await dependencies.resolveDomain(address, "ens");
      return resolution?.address ?? null;
    },
    validateNetworkAddress: async ({ network, address }) => {
      const bridge = await dependencies.getAccountBridgeByFamily(network.family);
      return bridge.validateAddress(address, {
        currencyId: network.id,
      });
    },
  };
}

export const contactsAddressValidationDependencies = createContactsAddressValidationDependencies();
