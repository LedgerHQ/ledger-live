// @flow

import type { BigNumber } from "bignumber.js";
import type { Account } from "./account";
import type { CryptoCurrency } from "./currencies";

export type BalanceHistory = Array<{
  date: Date,
  value: BigNumber
}>;

export type BalanceHistoryWithCountervalue = Array<{
  date: Date,
  value: BigNumber,
  countervalue: BigNumber
}>;

export type Portfolio = {
  balanceHistory: BalanceHistory,
  balanceAvailable: boolean,
  availableAccounts: Account[],
  unavailableCurrencies: CryptoCurrency[],
  accounts: Account[],
  range: PortfolioRange,
  histories: BalanceHistoryWithCountervalue[]
};

export type PortfolioRange = "year" | "month" | "week";
