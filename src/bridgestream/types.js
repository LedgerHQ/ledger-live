// @flow

import type { Account, CryptoCurrencyIds } from "../types";

export type AccountData = {
  id: string,
  currencyId: string,
  name: string,
  index: number,
  balance: string
};

export type DataIn = {
  // accounts to export (filter them to only be the visible ones)
  accounts: Account[],
  // settings
  settings: {
    counterValue?: string,
    counterValueExchange?: ?string,
    currenciesSettings: {
      [_: CryptoCurrencyIds]: {
        exchange?: ?string,
        confirmationsNb?: number
      }
    }
  },
  // the name of the exporter. e.g. "desktop" for the desktop app
  exporterName: string,
  // the version of the exporter. e.g. the desktop app version
  exporterVersion: string,

  chunkSize?: number
};
