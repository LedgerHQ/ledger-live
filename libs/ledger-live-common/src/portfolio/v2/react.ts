import type {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountLike,
  AccountPortfolio,
  AssetsDistribution,
  CurrencyPortfolio,
  Portfolio,
  PortfolioRange,
} from "@ledgerhq/types-live";
import { getAccountCurrency, flattenAccounts } from "../../account";
import { useCountervaluesState } from "../../countervalues/react";
import {
  getBalanceHistoryWithCountervalue,
  getPortfolio,
  getCurrencyPortfolio,
  getAssetsDistribution,
  getPortfolioCount,
  GetPortfolioOptionsType,
} from "./";
export function useBalanceHistoryWithCountervalue({
  account,
  range,
  to,
}: {
  account: AccountLike;
  range: PortfolioRange;
  to: Currency;
}): AccountPortfolio {
  const state = useCountervaluesState();
  const count = getPortfolioCount([account], range);
  return getBalanceHistoryWithCountervalue(account, range, count, state, to);
}
export function usePortfolio({
  accounts,
  range,
  to,
  options,
}: {
  accounts: AccountLike[];
  range: PortfolioRange;
  to: Currency;
  options?: GetPortfolioOptionsType;
}): Portfolio {
  const state = useCountervaluesState();
  return getPortfolio(accounts, range, state, to, options);
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
}): CurrencyPortfolio {
  const accounts = flattenAccounts(rawAccounts).filter(
    (a) => getAccountCurrency(a) === currency
  );
  const state = useCountervaluesState();
  return getCurrencyPortfolio(accounts, range, state, to);
}
export function useDistribution({
  accounts,
  to,
  showEmptyAccounts,
  hideEmptyTokenAccount,
}: {
  accounts: Account[];
  to: Currency;
  showEmptyAccounts?: boolean;
  hideEmptyTokenAccount?: boolean;
}): AssetsDistribution {
  const state = useCountervaluesState();
  return getAssetsDistribution(accounts, state, to, {
    minShowFirst: 6,
    maxShowFirst: 6,
    showFirstThreshold: 0.95,
    showEmptyAccounts: !!showEmptyAccounts,
    hideEmptyTokenAccount: !!hideEmptyTokenAccount,
  });
}
