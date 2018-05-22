// @flow

import type { CryptoCurrency, Unit } from "./currencies";

import type { OperationRaw, Operation } from "./operation";

export type Address = {
  str: string,
  path: string,
}

export type AccountRaw = {
  // unique account identifier
  id: string,

  // account xpub
  xpub: string,

  // account path on the device
  path: string,

  // account wallet path on the device
  walletPath: string,

  // account name
  name: string,

  // whether or not the account is segwit (useful to not re-parse path everytime)
  isSegwit: boolean,

  // account bitcoinAddress received when derivating account path
  address: string,

  // bunch of fresh receive addresses, calculated by libcore
  addresses: Address[],

  // account balance in satoshi
  balance: number,

  // the last block height currently synchronized
  blockHeight: number,

  // whether or not the account is archived
  archived: boolean,

  // Actually used in the desktop app
  // TODO: should get rid of that if possible
  index: number,

  // ------------------------------------- Specific raw fields

  // account currency id
  currencyId: string,

  // list of operations
  operations: OperationRaw[],

  // user preferred magnitude. used to recover the account.unit
  unitMagnitude: number,

  // used to know when the last sync happened
  lastSyncDate: string
};

export type Account = {
  // unique account identifier
  id: string,

  // account xpub
  xpub: string,

  // account path on the device
  path: string,

  // account wallet path on the device
  walletPath: string,

  // account name
  name: string,

  // whether or not the account is segwit (useful to not re-parse path everytime)
  isSegwit: boolean,

  // account bitcoinAddress received when derivating account path
  address: string,

  // transaction all addresses (actually needed by desktop app)
  addresses: Address[],

  // account balance in satoshi
  balance: number,

  // the last block height currently synchronized
  blockHeight: number,

  // whether or not the account is archived
  archived: boolean,

  // Actually used in the desktop app
  // TODO: should get rid of that if possible
  index: number,

  // ------------------------------------- Specific account fields

  // currency of this account
  currency: CryptoCurrency,

  // lazy list of operations. potentially big & uncomplete list.
  operations: Operation[],

  // user preferred unit to use. unit is coming from currency.units. You can assume currency.units.indexOf(unit) will work. (make sure to preserve reference)
  unit: Unit,

  // used to know when the last sync happened
  lastSyncDate: Date
};
