// @flow

import type {
  Currency,
  Unit,
  TokenCurrency,
  FiatCurrency,
  CryptoCurrency,
  ExplorerView
} from "./currencies";

import type {
  CryptoCurrencyConfig,
  CryptoCurrencyObjMap,
  CryptoCurrencyIds
} from "../data/cryptocurrencies";

import type { DerivationMode } from "../derivation";

export type { DerivationMode };

export type { CryptoCurrencyConfig, CryptoCurrencyObjMap, CryptoCurrencyIds };

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

import type { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "./account";
export type { Account, AccountRaw };

import type { Operation, OperationRaw, OperationType } from "./operation";
export type { Operation, OperationRaw, OperationType };

export type {
  TokenCurrency,
  Currency,
  Unit,
  FiatCurrency,
  CryptoCurrency,
  ExplorerView
};

/**
 * Other stuff
 * -----------
 */

export type AccountIdParams = {
  type: string,
  version: string,
  currencyId: string,
  xpubOrAddress: string,
  derivationMode: DerivationMode
};

export type DailyOperationsSection = {
  day: Date,
  data: Operation[]
};

export type DailyOperations = {
  // operations grouped by day
  sections: DailyOperationsSection[],
  // Is the sections complete? means there is no more operations to pull
  completed: boolean
};

export type BalanceHistory = Array<{
  date: Date,
  value: BigNumber
}>;
