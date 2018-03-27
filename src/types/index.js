// @flow

import type { Currency, Unit } from "@ledgerhq/currencies";

/**
 *
 *                            Common models types
 *                            ===================
 *
 * Reference types to inspire from as this will comes from the libcore:
 * https://github.com/KhalilBellakrid/lib-ledger-core/tree/develop/core/src/api
 *
 * NB some bug in documentation w\ flowtypes https://github.com/documentationjs/documentation/issues/742
 * ^as soon as fixed, will use /** in the types properties to export doc
 *
 */

import type { Account, AccountRaw } from "./account";
export type { Account, AccountRaw };

import type { Operation, OperationRaw } from "./operation";
export type { Operation, OperationRaw };

// exporting here for convenience
export type { Currency, Unit };

/**
 * Other stuff
 * -----------
 */

export type DailyOperationsSection = {
  day: Date,
  data: Operation[]
};

/**
 * Nesting object map: crypto ticker -> fiat code -> Inner
 * e.g. CounterValuesPairing<number> can be { BTC: { USD: 1 } }
 */
export type CounterValuesPairing<Inner> = {
  [_: string]: { [_: string]: Inner }
};

export type Histoday = { [_: string]: number };

export type BalanceHistory = Array<{ date: Date, value: number }>;

/**
 * Synchronously lookup the history price of coin against a fiat.
 * the returned countervalue is expressed in satoshis per cents so it can be multiplied by the value to convert.
 * if Date is falsy, the current "latest" price is to be returned.
 * the value 0 or any falsy returned value is means the countervalue is not available.
 * It it up to GetPairHistory implementation to chose the date granularity to use.
 */
export type GetPairHistory = (
  coinTicker: string,
  fiat: string
) => (?Date) => ?number;

/**
 * Returns the calculated countervalue for an amount value and date
 * if date is not provided (falsy), Calc will return the "latest" countervalue
 */
export type Calc = (value: number, date?: Date) => number;

export type CalculateCounterValue = (cur: Currency, fiat: Unit) => Calc;
