// @flow

import type { BigNumber } from "bignumber.js";
import type { CryptoCurrency, Unit } from "./currencies";
import type { OperationRaw, Operation } from "./operation";

export type Account = {
  // unique account identifier
  id: string,

  // a unique way to identify a seed the account was associated with
  // it MUST be different between 2 seeds
  // but it is not necessarily the same between 2 accounts (if possible – not always possible)
  // in BTC like accounts, we use pubKey(purpose'/coinType')
  // For other accounts that don't have sub derivation, we have used the account address
  seedIdentifier: string,

  // account xpub if available
  xpub?: string,

  // Identify the derivation used. it allows us to map this to a derivation scheme.
  // exemple of values: segwit | unsplit | segwit_unsplit | mew | eth_mew (eg for etc accounts on eth)
  // the special value of '' means it's bip44 with purpose 44.
  derivationMode: string,

  // the iterated number to derivate the account in a given derivationMode config
  // in context of bip44, it would be the account field of bip44 ( m/purpose'/cointype'/account' )
  index: number,

  // next receive address. to be used to display to user.
  freshAddress: string,

  // The path linked to freshAddress. to be used to validate with the device if it corresponds to freshAddress.
  // exemple: 44'/0'/0'/0/0
  freshAddressPath: string,

  // account name
  name: string,

  // account balance in satoshi
  balance: BigNumber,

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
  lastSyncDate: Date,

  // A configuration for the endpoint to use. (usecase: Ripple node)
  endpointConfig?: ?string
};

export type AccountRaw = {
  id: string,
  seedIdentifier: string,
  xpub?: string,
  derivationMode: string,
  index: number,
  freshAddress: string,
  freshAddressPath: string,
  name: string,
  balance: string,
  blockHeight: number,
  // ------------------------------------- Specific raw fields
  currencyId: string,
  operations: OperationRaw[],
  pendingOperations: OperationRaw[],
  unitMagnitude: number,
  lastSyncDate: string,
  endpointConfig?: ?string
};
