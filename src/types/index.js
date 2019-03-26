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

import type {
  Account,
  AccountRaw,
  TokenAccount,
  TokenAccountRaw
} from "./account";
export type { Account, AccountRaw, TokenAccount, TokenAccountRaw };

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

import type {
  BalanceHistoryWithCountervalue,
  BalanceHistory,
  PortfolioRange,
  Portfolio
} from "./portfolio";
export type {
  BalanceHistory,
  BalanceHistoryWithCountervalue,
  PortfolioRange,
  Portfolio
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
