// @flow

import type { CryptoCurrency, Unit } from "./currencies";

import type { OperationRaw, Operation } from "./operation";

export type Account = {
  // unique account identifier
  id: string,

  // account xpub
  xpub: string,

  // The account field of bip44 ( m/purpose'/cointype'/account' )
  index: number,

  // next receive address. to be used to display to user.
  freshAddress: string,

  // The path linked to freshAddress. to be used to validate with the device if it corresponds to freshAddress.
  // exemple: 44'/0'/0'/0/0
  freshAddressPath: string,

  // account name
  name: string,

  // account balance in satoshi (later will be a BigInt)
  balance: number,

  // the last block height currently synchronized
  blockHeight: number,

  // ------------------------------------- Specific account fields

  // currency of this account
  currency: CryptoCurrency,

  // user preferred unit to use. unit is coming from currency.units. You can assume currency.units.indexOf(unit) will work. (make sure to preserve reference)
  unit: Unit,

  // lazy list of operations that exists on the blockchain.
  operations: Operation[],

  // pending operations that has been broadcasted but are not yet in operations
  // this is for optimistic updates UI. the Operation objects are temporary and
  // might not be the real one that will arrives on operations array.
  // only Operation#id needs to be guaranteed the same.
  // the array resulting of pendingOperations.concat(operations)
  // is guaranteed to contains unique ops (by id) at any time and also is time DESC sorted.
  pendingOperations: Operation[],

  // used to know when the last sync happened
  lastSyncDate: Date
};

export type AccountRaw = {
  id: string,
  xpub: string,
  index: number,
  freshAddress: string,
  freshAddressPath: string,
  name: string,
  balance: number,
  blockHeight: number,
  // ------------------------------------- Specific raw fields
  currencyId: string,
  operations: OperationRaw[],
  pendingOperations: OperationRaw[],
  unitMagnitude: number,
  lastSyncDate: string
};
