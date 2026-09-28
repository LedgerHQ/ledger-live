import type { ContactAddress } from "@domain/entity-contact";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { defaultContactAddressCurrencyPort } from "./defaultContactAddressCurrencyPort";

export function resolveContactAddressSupportsDomain(
  currencyId: ContactAddress["currencyId"] | undefined,
  supportsDomain: (network: CryptoCurrency) => boolean,
): boolean {
  const networkId =
    currencyId === undefined
      ? undefined
      : defaultContactAddressCurrencyPort.resolveNetworkId(currencyId);
  const network = networkId === undefined ? undefined : findCryptoCurrencyById(networkId);

  return network !== undefined && supportsDomain(network);
}
