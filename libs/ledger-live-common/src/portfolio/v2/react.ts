import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountLike,
  AccountPortfolio,
  AssetsDistribution,
  CurrencyPortfolio,
  Portfolio,
  PortfolioRange,
} from "@ledgerhq/types-live";
import { useEffect, useRef, useState } from "react";
import { getAccountCurrency, flattenAccounts } from "../../account";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useThrottledValues } from "../../hooks/useThrottledFunction";
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

/**
 * WARNING: expensive hook, do not use if you don't need all the data
 * that this computes.
 *
 * Computes the data necessary to plot a graph of the user's balance */
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

/**
 * keep a low throttling until the balance is available
 */
const lowThrottleDelay = 100;
/**
 * keep an intermediate throttle until some additional data is available
 */
const intermediateThrottleDelay = 300;
/**
 * Computes the data necessary to plot of a graph of the user's balance.
 * It throttles that expensive computation by throttling the `accounts` and
 * `countervalues` inputs as they can change very frequently and immediate
 * visual feedback of each of their update is not necessary for a good UX.
 * Initially the throttle delay is low (100ms) and as soon as we get the bare
 * minimum (total balance and the graph data for some of the accounts) we
 * increase the throttle delay to the value of the prop `stableThrottleDelay`.
 *
 * We have to do this throttling as there are too many frequent updates of
 * the `accounts` object and countervaluesState and the computation performed
 * to aggregate all the data to make a graph is very expensive, we don't want
 * to do this on every render as it would cause big frame drops.
 */
export function usePortfolioThrottled({
  accounts,
  range,
  to,
  options,
  stableThrottleDelay = 5000,
}: {
  accounts: AccountLike[];
  range: PortfolioRange;
  to: Currency;
  options?: GetPortfolioOptionsType;
  stableThrottleDelay?: number;
}): Portfolio {
  const [variableThrottleDelay, setVariableThrottleDelay] = useState(lowThrottleDelay);
  const cvState = useCountervaluesState();
  const [throttledCVState, throttledAccounts] = useThrottledValues(
    [cvState, accounts],
    variableThrottleDelay,
  );
  /**
   * Options are not supposed to change.
   * Ensure a non changing reference for options to avoid an infinite setState
   * loop if the consumer passes a new object literal to this hook at render
   * time.
   * */
  const opts = useRef(options);
  const [portfolio, setPortfolio] = useState(() =>
    getPortfolio(throttledAccounts, range, throttledCVState, to, opts.current),
  );

  const ignoreUseEffectFirstCall = useRef(true);
  useEffect(() => {
    if (ignoreUseEffectFirstCall.current) {
      ignoreUseEffectFirstCall.current = false;
      // avoid recomputing twice the initial state
      // (once at state initialisation, then once here at mount)
      return;
    }
    const portfolio = getPortfolio(throttledAccounts, range, throttledCVState, to, opts.current);
    setPortfolio(portfolio);
    if (portfolio.balanceAvailable) setVariableThrottleDelay(intermediateThrottleDelay);
    if (throttledAccounts.length > 0 && portfolio.availableAccounts.length > 0)
      setVariableThrottleDelay(stableThrottleDelay);
  }, [throttledAccounts, range, throttledCVState, to, stableThrottleDelay]);

  return portfolio;
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
  const accounts = flattenAccounts(rawAccounts).filter(a => getAccountCurrency(a) === currency);
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
