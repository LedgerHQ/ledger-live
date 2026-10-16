import type { ContactAddress } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto/legacy";
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
