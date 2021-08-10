import type { BigNumber } from "bignumber.js";
import type { AccountLike, AccountLikeArray } from "./account";
import type { CryptoCurrency, TokenCurrency } from "./currencies";
export type BalanceHistoryData = {
  date: Date;
  value: BigNumber;
};
export type BalanceHistory = BalanceHistoryData[];
export type BalanceHistoryRaw = Array<[string, string]>;
export type BalanceHistoryWithCountervalue = Array<{
  date: Date;
  value: BigNumber;
  countervalue: BigNumber;
}>;
export type ValueChange = {
  percentage: BigNumber | null | undefined;
  // value from 0 to 1. not defined if not meaningful
  value: BigNumber; // delta of change
};
export type AccountPortfolio = {
  history: BalanceHistoryWithCountervalue;
  countervalueAvailable: boolean;
  countervalueReceiveSum: BigNumber;
  countervalueSendSum: BigNumber;
  cryptoChange: ValueChange;
  // how much the account changes. value is in the account currency
  countervalueChange: ValueChange; // calculates the ROI. value in the countervalue unit.
};
export type CurrencyPortfolio = {
  history: BalanceHistoryWithCountervalue;
  countervalueAvailable: boolean;
  histories: BalanceHistoryWithCountervalue[];
  accounts: AccountLikeArray;
  cryptoChange: ValueChange;
  // how much the account changes. value is in the account currency
  countervalueChange: ValueChange; // calculates the ROI. value in the countervalue unit.
};
export type Portfolio = {
  balanceHistory: BalanceHistory;
  balanceAvailable: boolean;
  availableAccounts: AccountLike[];
  unavailableCurrencies: (CryptoCurrency | TokenCurrency)[];
  accounts: AccountLike[];
  range: PortfolioRange;
  histories: BalanceHistoryWithCountervalue[];
  countervalueReceiveSum: BigNumber;
  countervalueSendSum: BigNumber;
  countervalueChange: ValueChange; // calculates the ROI. value in the countervalue unit.
};
export type PortfolioRangeConfig = {
  count: number;
  granularityId: "HOUR" | "DAY" | "WEEK";
  // only supported here atm
  startOf: (arg0: Date) => Date;
  increment: number; // FIXME it should be a Date=>Date
};
export type PortfolioRange = "year" | "month" | "week" | "day";
export type AssetsDistribution = {
  // false if no distribution can be done (sum is zero)
  isAvailable: boolean;
  // a sorted list of assets with data
  list: Array<{
    currency: CryptoCurrency | TokenCurrency;
    distribution: number;
    // % of the total (normalized in 0-1)
    amount: BigNumber;
    countervalue: BigNumber; // countervalue of the amount that was calculated based of the rate provided
  }>;
  // number of accounts to show first (before the see all)
  showFirst: number;
  // sum of all countervalues
  sum: BigNumber;
};
