import type { ContactAddress } from "@domain/entity-contact";
import { getNetworkSortKey } from "./supportedCurrencies";

export function sortAddressesByNetwork(addresses: readonly ContactAddress[]): ContactAddress[] {
  return [...addresses].sort((left, right) => {
    const networkComparison = getNetworkSortKey(left.currencyId).localeCompare(
      getNetworkSortKey(right.currencyId),
    );

    return networkComparison || left.currencyId.localeCompare(right.currencyId);
  });
}
