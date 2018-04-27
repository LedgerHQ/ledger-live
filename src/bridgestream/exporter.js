// @flow
import type { Account } from "../types/account";

export type DataIn = {
  // accounts to export (filter them to only be the visible ones)
  accounts: Account[],
  // the name of the exporter. e.g. "desktop" for the desktop app
  exporterName: string,
  // the version of the exporter. e.g. the desktop app version
  exporterVersion: string,
  // enable a mode that will add empty space to make all chunks of same size. to makes QR code of same dimension
  pad?: boolean
};

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
  const chunksFormatVersion = 2;
  const data = [
    ["meta", chunksFormatVersion, exporterName, exporterVersion],
    ...accounts.map(account => [
      "account",
      account.id,
      account.name,
      account.currency.id
    ])
  ];
  let r = data.map((arr, i) => JSON.stringify([data.length, i, ...arr]));
  if (pad) {
    const max = r.reduce((max, s) => Math.max(max, s.length), 0);
    r = r.map(s => s.padEnd(max));
  }
  return r;
}
