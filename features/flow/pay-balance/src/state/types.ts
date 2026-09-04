import type { PAY_CARD_BALANCE_FILTER_ALL } from "./constants";

/** `"all"` or the currencyId of a single stablecoin. Never a ticker: ids are stable. */
export type BalanceFilter = typeof PAY_CARD_BALANCE_FILTER_ALL | (string & {});

/** Fully persisted across app restarts: every field is stored under the `payCard` key. */
export type PayCardBalanceState = Readonly<{
  balanceFilter: BalanceFilter;
}>;
