// @flow

import type { Account } from "../types/account";

export type AccountData = {
  id: string,
  currencyId: string,
  name: string,
  freshAddress: string,
  freshAddressPath: string,
  index: number,
  balance: string
};

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

export type Result = {
  accounts: AccountData[],
  meta: {
    chunksFormatVersion: number,
    exporterName: string,
    exporterVersion: string
  }
};
