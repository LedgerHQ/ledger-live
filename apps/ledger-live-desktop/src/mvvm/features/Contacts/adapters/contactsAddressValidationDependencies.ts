import { getRegistriesForDomain } from "@ledgerhq/domain-service/registries/index";
import { resolveDomain } from "@ledgerhq/domain-service/resolvers/index";
import { validateDomain } from "@ledgerhq/domain-service/utils/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { getAccountBridgeByFamily } from "@ledgerhq/live-common/bridge/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { createContactsAddressValidationDependencies } from "@features/flow-contacts";

export const contactsAddressValidationDependencies = createContactsAddressValidationDependencies({
  findTokenById: currencyId => getCryptoAssetsStore().findTokenById(currencyId),
  getAccountBridgeByFamily,
  supportsDomain: sendFeatures.supportsDomain,
  getRegistriesForDomain,
  isAddressSanctioned,
  resolveDomain,
  validateDomain,
});
