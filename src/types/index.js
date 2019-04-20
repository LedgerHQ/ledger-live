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

import type {
  Account,
  AccountRaw,
  TokenAccount,
  TokenAccountRaw
} from "./account";

import type { Operation, OperationRaw, OperationType } from "./operation";

import type {
  BalanceHistoryWithCountervalue,
  BalanceHistory,
  PortfolioRange,
  Portfolio
} from "./portfolio";

export type { DerivationMode };

export type { CryptoCurrencyConfig, CryptoCurrencyObjMap, CryptoCurrencyIds };

export type { Account, AccountRaw, TokenAccount, TokenAccountRaw };

export type { Operation, OperationRaw, OperationType };

export type {
  TokenCurrency,
  Currency,
  Unit,
  FiatCurrency,
  CryptoCurrency,
  ExplorerView
};

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
