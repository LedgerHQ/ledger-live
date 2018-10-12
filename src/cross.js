// @flow
// cross helps dealing with cross-project feature like export/import & cross project conversions

import { BigNumber } from "bignumber.js";
import lzw from "node-lzw";
import type { Account, CryptoCurrencyIds } from "./types";
import { runDerivationScheme, getDerivationScheme } from "./derivation";
import { decodeAccountId } from "./account";
import { getCryptoCurrencyById } from "./currencies";

export type AccountData = {
  id: string,
  currencyId: string,
  seedIdentifier: string,
  derivationMode: string,
  name: string,
  index: number,
  balance: string
};

export type CryptoSettings = {
  exchange?: ?string,
  confirmationsNb?: number
};

export type Settings = {
  counterValue?: string,
  counterValueExchange?: ?string,
  currenciesSettings: {
    [_: CryptoCurrencyIds]: CryptoSettings
  }
};

export type DataIn = {
  // accounts to export (filter them to only be the visible ones)
  accounts: Account[],
  // settings
  settings: Settings,
  // the name of the exporter. e.g. "desktop" for the desktop app
  exporterName: string,
  // the version of the exporter. e.g. the desktop app version
  exporterVersion: string,

  chunkSize?: number
};

export type Result = {
  accounts: AccountData[],
  settings: Settings,
  meta: {
    exporterName: string,
    exporterVersion: string
  }
};

export function encode({
  accounts,
  settings,
  exporterName,
  exporterVersion
}: DataIn): string {
  return lzw.encode(
    JSON.stringify({
      meta: { exporterName, exporterVersion },
      accounts: accounts.map(accountToAccountData),
      settings
    })
  );
}

export function decode(bytes: string): Result {
  return JSON.parse(lzw.decode(bytes));
}

export function accountToAccountData({
  id,
  name,
  seedIdentifier,
  derivationMode,
  currency,
  index,
  balance
}: Account): AccountData {
  return {
    id,
    name,
    seedIdentifier,
    derivationMode,
    currencyId: currency.id,
    index,
    balance: balance.toString()
  };
}

// reverse the account data to an account.
// this restore the essential data of an account and the result of the fields
// are assumed to be restored during first sync
export const accountDataToAccount = ({
  id,
  currencyId,
  name,
  index,
  balance,
  derivationMode,
  seedIdentifier
}: AccountData): Account => {
  const { xpubOrAddress } = decodeAccountId(id); // TODO rename in AccountId xpubOrAddress
  const currency = getCryptoCurrencyById(currencyId);
  let xpub = "";
  let freshAddress = "";
  let freshAddressPath = "";
  if (currency.family === "bitcoin") {
    xpub = xpubOrAddress;
  } else {
    freshAddress = xpubOrAddress;
    freshAddressPath = runDerivationScheme(
      getDerivationScheme({ currency, derivationMode }),
      currency,
      { account: index }
    );
  }

  const account: $Exact<Account> = {
    id,
    derivationMode,
    seedIdentifier,
    xpub,
    name,
    currency,
    index,
    freshAddress,
    freshAddressPath,
    // these fields will be completed as we will sync
    blockHeight: 0,
    balance: BigNumber(balance),
    operations: [],
    pendingOperations: [],
    unit: currency.units[0],
    lastSyncDate: new Date(0)
  };
  return account;
};
