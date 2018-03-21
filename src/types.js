// @flow
import type { Currency, Unit } from "@ledgerhq/currencies";

// common models types

/**
 */
export type { Currency, Unit }; // convenient to export them back

/**
 */
export type Operation = {
  id: string,
  hash: string,
  address: string,
  amount: number,
  date: Date,
  confirmations: number,
  accountId: string
};

/**
 */
export type Account = {
  // unique id for the account. we typically use the xpub but it's convenient to name it id.
  id: string,
  // user defined name of the account
  name: string,
  // xpub of the account
  xpub: string,
  // current address of thie account. depending on the crypto, it might changes over time.
  address: string,
  // current total balance of this account.
  balance: number,
  // currency of this account
  currency: Currency,
  // user preferred unit to use. unit is coming from currency.units
  unit: Unit,
  // lazy list of operations. potentially big & uncomplete list.
  operations: Operation[],
  // if true, the account won't be visible
  archived: boolean,
  // minimal nb of blocks to consider an operation confirmed (set by the user)
  minConfirmations: number
};

/**
 */
export type OperationRaw = {
  id: string,
  hash: string,
  address: string,
  amount: number,
  date: string,
  confirmations: number,
  accountId: string
};

/**
 */
export type AccountRaw = {
  id: string,
  name: string,
  xpub: string,
  address: string,
  balance: number,
  coinType: number,
  unit: Unit,
  operations: OperationRaw[],
  archived: boolean,
  minConfirmations: number
};
