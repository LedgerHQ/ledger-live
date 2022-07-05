import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type {
  AccountLike,
  AccountLikeArray,
  GranularityId,
} from "@ledgerhq/types-live";

// TODO Portfolio: move to src/types/portfolio.js
export type BalanceHistoryData = {
  date: Date | null | undefined;
  value: number;
};
export type BalanceHistory = BalanceHistoryData[];
export type BalanceHistoryWithCountervalue = (BalanceHistoryData & {
  countervalue: number | null | undefined;
})[];
export type PortfolioRangeConfig = {
  count?: number;
  granularityId: GranularityId;
  startOf: (arg0: Date) => Date;
  increment: number; // FIXME it should be a Date=>Date
};
export type PortfolioRange = "all" | "year" | "month" | "week" | "day";
export type AccountPortfolio = {
  history: BalanceHistoryWithCountervalue;
  countervalueAvailable: boolean;
  countervalueReceiveSum: number;
  countervalueSendSum: number;
  cryptoChange: ValueChange;
  // how much the account changes. value is in the account currency
  countervalueChange: ValueChange; // calculates the ROI. value in the countervalue unit.
};
export type ValueChange = {
  percentage: number | null | undefined;
  // value from 0 to 1. not defined if not meaningful
  value: number; // delta of change
};
export type Portfolio = {
  balanceHistory: BalanceHistory;
  balanceAvailable: boolean;
  availableAccounts: AccountLike[];
  unavailableCurrencies: (CryptoCurrency | TokenCurrency)[];
  accounts: AccountLike[];
  range: PortfolioRange;
  histories: BalanceHistoryWithCountervalue[];
  countervalueReceiveSum: number;
  countervalueSendSum: number;
  countervalueChange: ValueChange; // calculates the ROI. value in the countervalue unit.
};
export type CurrencyPortfolio = {
  history: BalanceHistoryWithCountervalue;
  countervalueAvailable: boolean;
  histories: BalanceHistoryWithCountervalue[];
  accounts: AccountLikeArray;
  cryptoChange: ValueChange;
  range: PortfolioRange;
  // how much the account changes. value is in the account currency
  countervalueChange: ValueChange; // calculates the ROI. value in the countervalue unit.
};
export type AssetsDistribution = {
  // false if no distribution can be done (sum is zero)
  isAvailable: boolean;
  // a sorted list of assets with data
  list: {
    currency: CryptoCurrency | TokenCurrency;
    distribution: number;
    // % of the total (normalized in 0-1)
    amount: number;
    countervalue: number; // countervalue of the amount that was calculated based of the rate provided
  }[];
  // number of accounts to show first (before the see all)
  showFirst: number;
  // sum of all countervalues
  sum: number;
};
