import React, { Component } from "react";
import { Provider } from "react-redux";
import Config from "react-native-config";
import thunk from "redux-thunk";
import { createStore, applyMiddleware, compose, type Middleware } from "redux";
import { importPostOnboardingState } from "@ledgerhq/live-common/postOnboarding/actions";
import { CounterValuesStateRaw } from "@ledgerhq/live-common/countervalues/types";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  getAccounts,
  getCountervalues,
  getSettings,
  getBle,
  getPostOnboardingState,
  getProtect,
} from "../db";
import reducers from "../reducers";
import { importSettings } from "../actions/settings";
import { importStore as importAccounts } from "../actions/accounts";
import { importBle } from "../actions/ble";
import { updateProtectData, updateProtectStatus } from "../actions/protect";
import { INITIAL_STATE as settingsState, supportedCountervalues } from "../reducers/settings";
import { listCachedCurrencyIds, hydrateCurrency } from "../bridge/cache";

const middlewares: [Middleware] = [thunk];

if (Config.DEBUG_RNDEBUGGER) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createDebugger = require("redux-flipper").default;
  middlewares.push(createDebugger());
}

export const store = createStore(reducers, compose(applyMiddleware(...middlewares)));

export type StoreType = typeof store;

export default class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void;
    children: (ready: boolean, initialCountervalues?: CounterValuesStateRaw) => JSX.Element;
  },
  {
    ready: boolean;
    initialCountervalues?: CounterValuesStateRaw;
  }
> {
  state = {
    ready: false,
    initialCountervalues: undefined,
  };

  componentDidMount() {
    return this.init();
  }

  componentDidCatch(e: Error) {
    console.error(e);
    throw e;
  }

  async init() {
    const bleData = await getBle();
    store.dispatch(importBle(bleData));
    const settingsData = await getSettings();

    const cachedCurrencyIds = await listCachedCurrencyIds();
    // hydrate the store with the bridge/cache
    // Promise.allSettled doesn't exist in RN
    await Promise.all(
      cachedCurrencyIds
        .map(id => {
          const currency = findCryptoCurrencyById?.(id);
          return currency ? hydrateCurrency(currency) : Promise.reject();
        })
        .map(promise =>
          promise
            .then((value: unknown) => ({ status: "fulfilled", value }))
            .catch((reason: unknown) => ({ status: "rejected", reason })),
        ),
    );

    if (
      settingsData &&
      settingsData.counterValue &&
      !supportedCountervalues.find(({ ticker }) => ticker === settingsData.counterValue)
    ) {
      settingsData.counterValue = settingsState.counterValue;
    }

    store.dispatch(importSettings(settingsData));
    const accountsData = await getAccounts();
    store.dispatch(importAccounts(accountsData));

    const postOnboardingState = await getPostOnboardingState();
    if (postOnboardingState) {
      store.dispatch(importPostOnboardingState({ newState: postOnboardingState }));
    }

    const protect = await getProtect();
    if (protect) {
      store.dispatch(updateProtectData(protect.data));
      store.dispatch(updateProtectStatus(protect.protectStatus));
    }

    const initialCountervalues = await getCountervalues();
    this.setState(
      {
        ready: true,
        initialCountervalues,
      },
      () => {
        this.props.onInitFinished();
      },
    );
  }

  render() {
    const { children } = this.props;
    const { ready, initialCountervalues } = this.state;
    return <Provider store={store}>{children(ready, initialCountervalues)}</Provider>;
  }
}
