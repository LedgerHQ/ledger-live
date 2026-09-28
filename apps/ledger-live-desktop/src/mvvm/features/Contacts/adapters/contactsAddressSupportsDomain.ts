import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { defaultContactAddressCurrencyPort } from "@features/flow-contacts";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";

export function contactsAddressSupportsDomain(
  currencyId: ContactAddress["currencyId"] | undefined,
): boolean {
  const networkId =
    currencyId === undefined
      ? undefined
      : defaultContactAddressCurrencyPort.resolveNetworkId(currencyId);
  const network = networkId === undefined ? undefined : findCryptoCurrencyById(networkId);

  return network !== undefined && sendFeatures.supportsDomain(network);
}
