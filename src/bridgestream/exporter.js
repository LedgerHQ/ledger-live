// @flow

import type { Account } from "../types/account";
import type { DataIn, AccountData } from "./types";

export function accountToAccountData({
  id,
  name,
  currency,
  index,
  freshAddress,
  freshAddressPath,
  balance
}: Account): AccountData {
  return {
    id,
    name,
    currencyId: currency.id,
    index,
    freshAddressPath,
    freshAddress,
    balance: balance.toString()
  };
}

/**
 * export data into a chunk of string
 * @memberof bridgestream/exporter
 */
export function makeChunks({
  accounts,
  exporterName,
  exporterVersion,
  pad
}: DataIn): string[] {
  const chunksFormatVersion = 3;
  const data = [
    ["meta", chunksFormatVersion, exporterName, exporterVersion],
    ...accounts.map(account => ["account", accountToAccountData(account)])
  ];
  let r = data.map((arr, i) => JSON.stringify([data.length, i, ...arr]));
  if (pad) {
    const max = r.reduce((max, s) => Math.max(max, s.length), 0);
    r = r.map(s => s.padEnd(max));
  }
  return r;
}
