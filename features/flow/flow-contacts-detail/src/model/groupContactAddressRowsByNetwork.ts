import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  type CryptoCurrency,
} from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./ports";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRow } from "../types";

export function groupContactAddressRowsByNetwork(
  rows: readonly ContactDetailAddressRow[],
  currencyPort: ContactAddressCurrencyPort,
): readonly ContactDetailAddressNetworkGroup[] {
  const groups: ContactDetailAddressNetworkGroup[] = [];

  for (const row of rows) {
    const networkId = currencyPort.resolveNetworkId(row.currencyId);
    const groupKey = networkId ?? row.currencyId;
    const lastGroup = groups.at(-1);
    const lastGroupKey =
      lastGroup === undefined
        ? undefined
        : (currencyPort.resolveNetworkId(lastGroup.rows[0]!.currencyId) ??
          lastGroup.rows[0]!.currencyId);

    if (lastGroup !== undefined && lastGroupKey === groupKey) {
      groups[groups.length - 1] = {
        ...lastGroup,
        rows: [...lastGroup.rows, row],
      };
      continue;
    }

    groups.push(createNetworkGroup(row, networkId));
  }

  return groups;
}

function createNetworkGroup(
  row: ContactDetailAddressRow,
  networkId: CryptoCurrency["id"] | undefined,
): ContactDetailAddressNetworkGroup {
  if (networkId !== undefined) {
    const network = getCryptoCurrencyById(networkId);

    return {
      networkId: network.id,
      networkName: network.name,
      networkTicker: network.ticker,
      rows: [row],
    };
  }

  const cryptoCurrency = findCryptoCurrencyById(row.currencyId);

  if (cryptoCurrency !== undefined) {
    return {
      networkId: cryptoCurrency.id,
      networkName: cryptoCurrency.name,
      networkTicker: cryptoCurrency.ticker,
      rows: [row],
    };
  }

  return {
    networkId: row.currencyId as CryptoCurrency["id"],
    networkName: row.label,
    networkTicker: row.label,
    rows: [row],
  };
}
