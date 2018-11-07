// @flow
/* eslint import/no-cycle: 0 */
import { AppState, NetInfo } from "react-native";
import { createSelector } from "reselect";
import createCounterValues from "@ledgerhq/live-common/lib/countervalues";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { setExchangePairsAction } from "./actions/settings";
import { currenciesSelector } from "./reducers/accounts";
import {
  counterValueCurrencySelector,
  counterValueExchangeSelector,
  currencySettingsSelector,
  intermediaryCurrency,
} from "./reducers/settings";
import network from "./api/network";

const LEDGER_COUNTERVALUES_API = "https://countervalues.api.live.ledger.com";

const pairsSelector = createSelector(
  currenciesSelector,
  counterValueCurrencySelector,
  counterValueExchangeSelector,
  state => state,
  (currencies, counterValueCurrency, counterValueExchange, state) =>
    currencies.length === 0
      ? []
      : [
          {
            from: intermediaryCurrency,
            to: counterValueCurrency,
            exchange: counterValueExchange,
          },
        ].concat(
          currencies
            .filter(c => c.ticker !== intermediaryCurrency.ticker)
            .map(currency => ({
              from: currency,
              to: intermediaryCurrency,
              exchange: currencySettingsSelector(state, { currency }).exchange,
            })),
        ),
);

const addExtraPollingHooks = (schedulePoll, cancelPoll) => {
  let appIsActive = true;
  // assuming we are connected because we want to start polling when we go connected again
  let networkIsConnected = true;

  function handleAppStateChange(nextAppState: string) {
    if (nextAppState === "active") {
      appIsActive = true;
      // poll when coming back
      schedulePoll(2000);
    } else {
      appIsActive = false;
      cancelPoll();
    }
  }

  function handleConnectivityChange(isConnected: boolean) {
    if (isConnected && !networkIsConnected && appIsActive) {
      // poll when recovering a connection
      schedulePoll(3000);
    }
    networkIsConnected = isConnected;
  }

  AppState.addEventListener("change", handleAppStateChange);
  NetInfo.isConnected.addEventListener(
    "connectionChange",
    handleConnectivityChange,
  );

  return () => {
    AppState.removeEventListener("change", handleAppStateChange);
    NetInfo.isConnected.removeEventListener(
      "connectionChange",
      handleConnectivityChange,
    );
  };
};

const CounterValues = createCounterValues({
  log: __DEV__
    ? (...args) => console.log("CounterValues:", ...args) // eslint-disable-line no-console
    : undefined,
  getAPIBaseURL: () => LEDGER_COUNTERVALUES_API,
  storeSelector: state => state.countervalues,
  pairsSelector,
  setExchangePairsAction,
  addExtraPollingHooks,
  network,
});

type PC = Promise<CryptoCurrency[]>;

let sortCache;
export const getFullListSortedCryptoCurrencies: () => PC = () => {
  if (!sortCache) {
    sortCache = CounterValues.fetchTickersByMarketcap().then(
      tickers => {
        const list = listCryptoCurrencies().slice(0);
        const prependList = [];
        tickers.forEach(ticker => {
          const item = list.find(c => c.ticker === ticker);
          if (item) {
            list.splice(list.indexOf(item), 1);
            prependList.push(item);
          }
        });
        return prependList.concat(list);
      },
      () => {
        sortCache = null; // reset the cache for the next time it comes here to "try again"
        return listCryptoCurrencies(); // fallback on default sort
      },
    );
  }

  return sortCache;
};

export default CounterValues;
