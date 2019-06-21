// @flow

import type { BigNumber } from "bignumber.js";
import type { TokenAccount, Account } from "./account";
import type { CryptoCurrency, TokenCurrency } from "./currencies";

export type BalanceHistory = Array<{
  date: Date,
  value: BigNumber
}>;

export type BalanceHistoryWithCountervalue = Array<{
  date: Date,
  value: BigNumber,
  countervalue: BigNumber
}>;

export type ValueChange = {
  percentage: ?BigNumber, // value from 0 to 1. not defined if not meaningful
  value: BigNumber // delta of change
};

export type AccountPortfolio = {
  history: BalanceHistoryWithCountervalue,
  countervalueAvailable: boolean,
  countervalueReceiveSum: BigNumber,
  countervalueSendSum: BigNumber,
  cryptoChange: ValueChange, // how much the account changes. value is in the account currency
  countervalueChange: ValueChange // calculates the ROI. value in the countervalue unit.
};

export type Portfolio = {
  balanceHistory: BalanceHistory,
  balanceAvailable: boolean,
  availableAccounts: (Account | TokenAccount)[],
  unavailableCurrencies: (CryptoCurrency | TokenCurrency)[],
  accounts: (Account | TokenAccount)[],
  range: PortfolioRange,
  histories: BalanceHistoryWithCountervalue[],
  countervalueReceiveSum: BigNumber,
  countervalueSendSum: BigNumber,
  countervalueChange: ValueChange // calculates the ROI. value in the countervalue unit.
};

export type PortfolioRange = "year" | "month" | "week";

export type AssetsDistribution = {
  // false if no distribution can be done (sum is zero)
  isAvailable: boolean,
  // a sorted list of assets with data
  list: Array<{
    currency: CryptoCurrency | TokenCurrency,
    distribution: number, // % of the total (normalized in 0-1)
    amount: BigNumber,
    countervalue: BigNumber // countervalue of the amount that was calculated based of the rate provided
  }>,
  // number of accounts to show first (before the see all)
  showFirst: number,
  // sum of all countervalues
  sum: BigNumber
};
