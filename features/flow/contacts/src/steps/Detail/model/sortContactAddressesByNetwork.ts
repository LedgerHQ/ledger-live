import type { ContactAddress } from "@domain/entity-contact";
import { listCryptoCurrencies, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./ports";

const DEFAULT_NETWORK_ORDER_INDEX: ReadonlyMap<CryptoCurrency["id"], number> = new Map(
  listCryptoCurrencies().map((network, index) => [network.id, index]),
);

function createNetworkOrderIndex(
  networkIds?: readonly CryptoCurrency["id"][],
): ReadonlyMap<CryptoCurrency["id"], number> {
  if (networkIds === undefined) {
    return DEFAULT_NETWORK_ORDER_INDEX;
  }

  return new Map(networkIds.map((networkId, index) => [networkId, index]));
}

function compareContactAddressesByNetwork(
  left: ContactAddress,
  right: ContactAddress,
  resolveNetworkId: ContactAddressCurrencyPort["resolveNetworkId"],
  networkOrderIndex: ReadonlyMap<CryptoCurrency["id"], number>,
): number {
  const leftNetworkId = resolveNetworkId(left.currencyId);
  const rightNetworkId = resolveNetworkId(right.currencyId);
  const leftIndex =
    leftNetworkId === undefined
      ? Number.MAX_SAFE_INTEGER
      : (networkOrderIndex.get(leftNetworkId) ?? Number.MAX_SAFE_INTEGER);
  const rightIndex =
    rightNetworkId === undefined
      ? Number.MAX_SAFE_INTEGER
      : (networkOrderIndex.get(rightNetworkId) ?? Number.MAX_SAFE_INTEGER);

  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }

  const labelComparison = left.label.localeCompare(right.label);

  if (labelComparison !== 0) {
    return labelComparison;
  }

  return left.id.localeCompare(right.id);
}

export function sortContactAddressesByNetwork(
  addresses: readonly ContactAddress[],
  currencyPort: ContactAddressCurrencyPort,
  networkIds?: readonly CryptoCurrency["id"][],
): ContactAddress[] {
  const networkOrderIndex = createNetworkOrderIndex(networkIds);

  return [...addresses].sort((left, right) =>
    compareContactAddressesByNetwork(
      left,
      right,
      currencyPort.resolveNetworkId,
      networkOrderIndex,
    ),
  );
}
