// @flow

import type { Currency, Unit } from "@ledgerhq/currencies";

import type { OperationRaw, Operation } from "./operation";

/**
 *
 *                                  Account
 *                                  -------
 *
 */

export type AccountRaw = {
  // unique account identifier
  id: string,

  // account xpub
  xpub: string,

  // account path on the device
  path: string,

  // account root path on the device
  rootPath: string,

  // account name
  name: string,

  // account address
  address: string,

  // transaction all addresses (actually needed by desktop app)
  addresses: string[],

  // account balance in satoshi
  balance: number,

  // account coin type
  coinType: number,

  // the last block height currently synchronized
  blockHeight: number,

  // whether or not the account is archived
  archived: boolean,

  // Actually used in the desktop app
  // TODO: should get rid of that if possible
  index: number,

  // Actually used in the desktop app
  // TODO: should be moved to separate reducer, I think. Because balance is
  // derived data, it's not really data.
  balanceByDay: any,

  // ------------------------------------- Specific raw fields

  // list of operations
  operations: OperationRaw[],

  // user preferred magnitude. used to recover the account.unit
  unitMagnitude: number,

  // used to know when the last sync happened
  blockTime: string
};

export type Account = {
  // unique account identifier
  id: string,

  // account xpub
  xpub: string,

  // account path on the device
  // TODO: get rid of it
  path: string,

  // account root path on the device
  // TODO: get rid of it
  rootPath: string,

  // account name
  name: string,

  // account address
  address: string,

  // transaction all addresses (actually needed by desktop app)
  addresses: string[],

  // account balance in satoshi
  balance: number,

  // account coin type
  coinType: number,

  // the last block height currently synchronized
  blockHeight: number,

  // whether or not the account is archived
  archived: boolean,

  // Actually used in the desktop app
  // TODO: should get rid of that if possible
  index: number,

  // Actually used in the desktop app
  // TODO: should be moved to separate reducer, I think. Because balance is
  // derived data, it's not really data.
  balanceByDay: any,

  // ------------------------------------- Specific account fields

  // currency of this account
  currency: Currency,

  // lazy list of operations. potentially big & uncomplete list.
  operations: Operation[],

  // user preferred unit to use. unit is coming from currency.units. You can assume currency.units.indexOf(unit) will work. (make sure to preserve reference)
  unit: Unit,

  // used to know when the last sync happened
  blockTime: Date
};
