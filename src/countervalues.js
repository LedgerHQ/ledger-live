// @flow

import { AppState, NetInfo } from "react-native";
import { createSelector } from "reselect";
import createCounterValues from "@ledgerhq/live-common/lib/countervalues";
import { setExchangePairsAction } from "./actions/settings";
import { currenciesSelector } from "./reducers/accounts";
import {
  counterValueCurrencySelector,
  counterValueExchangeSelector,
  currencySettingsSelector,
  intermediaryCurrency,
} from "./reducers/settings";

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
  log: (...args) => console.log("CounterValues:", ...args),
  getAPIBaseURL: () => LEDGER_COUNTERVALUES_API,
  storeSelector: state => state.countervalues,
  pairsSelector,
  setExchangePairsAction,
  addExtraPollingHooks,
});

export default CounterValues;
