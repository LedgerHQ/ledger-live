// @flow

import lzw from "node-lzw";
import type { Account } from "../types/account";
import type { DataIn, AccountData } from "./types";
import { makeChunks as qrStreamMakeChunks } from "../qrstream/exporter";

export function accountToAccountData({
  id,
  name,
  currency,
  index,
  balance
}: Account): AccountData {
  return {
    id,
    name,
    currencyId: currency.id,
    index,
    balance: balance.toString()
  };
}

/**
 * export data into a chunk of string
 * @memberof bridgestream/exporter
 */
export function makeChunks({
  accounts,
  settings,
  exporterName,
  exporterVersion,
  chunkSize = 120
}: DataIn): string[] {
  return qrStreamMakeChunks(
    lzw.encode(
      JSON.stringify({
        meta: { exporterName, exporterVersion },
        accounts: accounts.map(accountToAccountData),
        settings
      })
    ),
    chunkSize
  );
}
