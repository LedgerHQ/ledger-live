import type {
  Account,
  AccountLike,
  Currency,
  CryptoCurrency,
  TokenCurrency,
} from "../../types";
import { getAccountCurrency, flattenAccounts } from "../../account";
import { useCountervaluesState } from "../../countervalues/react";
import {
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getCurrencyPortfolio,
  getAssetsDistribution,
  getPortfolioCount,
} from "./";
import type { PortfolioRange } from "./types";
export function useBalanceHistoryWithCountervalue({
  account,
  range,
  to,
}: {
  account: AccountLike;
  range: PortfolioRange;
  to: Currency;
}) {
  const state = useCountervaluesState();
  const count = getPortfolioCount([account], range);
  return getBalanceHistoryWithCountervalue(account, range, count, state, to);
}
export function usePortfolio({
  accounts,
  range,
  to,
}: {
  accounts: Account[];
  range: PortfolioRange;
  to: Currency;
}) {
  const state = useCountervaluesState();
  return getPortfolio(accounts, range, state, to);
}
export function useCurrencyPortfolio({
  accounts: rawAccounts,
  range,
  to,
  currency,
}: {
  accounts: Account[];
  range: PortfolioRange;
  to: Currency;
  currency: CryptoCurrency | TokenCurrency;
}) {
  const accounts = flattenAccounts(rawAccounts).filter(
    (a) => getAccountCurrency(a) === currency
  );
  const state = useCountervaluesState();
  return getCurrencyPortfolio(accounts, range, state, to);
}
export function useDistribution({
  accounts,
  to,
}: {
  accounts: Account[];
  to: Currency;
}) {
  const state = useCountervaluesState();
  return getAssetsDistribution(accounts, state, to, {
    minShowFirst: 6,
    maxShowFirst: 6,
    showFirstThreshold: 0.95,
  });
}
