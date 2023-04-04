import React, { Component } from "react";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { createStore, applyMiddleware, compose } from "redux";
import { importPostOnboardingState } from "@ledgerhq/live-common/postOnboarding/actions";
import { CounterValuesStateRaw } from "@ledgerhq/live-common/countervalues/types";
import { initialState as postOnboardingState } from "@ledgerhq/live-common/postOnboarding/reducer";
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
import {
  INITIAL_STATE as settingsState,
  supportedCountervalues,
} from "../reducers/settings";
import { INITIAL_STATE as accountsState } from "../reducers/accounts";
import { INITIAL_STATE as appstateState } from "../reducers/appstate";
import { INITIAL_STATE as bleState } from "../reducers/ble";
import { INITIAL_STATE as notificationsState } from "../reducers/notifications";
import { INITIAL_STATE as swapState } from "../reducers/swap";
import { INITIAL_STATE as ratingsState } from "../reducers/ratings";
import { INITIAL_STATE as walletconnectState } from "../reducers/walletconnect";
import { INITIAL_STATE as dynamicContentState } from "../reducers/dynamicContent";
import { INITIAL_STATE as protectState } from "../reducers/protect";
import type { State } from "../reducers/types";
import { listCachedCurrencyIds, hydrateCurrency } from "../bridge/cache";

const INITIAL_STATE: State = {
  accounts: accountsState,
  appstate: appstateState,
  ble: bleState,
  notifications: notificationsState,
  ratings: ratingsState,
  settings: settingsState,
  swap: swapState,
  walletconnect: walletconnectState,
  postOnboarding: postOnboardingState,
  dynamicContent: dynamicContentState,
  protect: protectState,
};

export const store = createStore(
  reducers,
  INITIAL_STATE,
  compose(applyMiddleware(thunk)),
);

export type StoreType = typeof store;

export default class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void;
    children: (
      ready: boolean,
      store: StoreType,
      initialCountervalues?: CounterValuesStateRaw,
    ) => JSX.Element;
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
    await Promise.allSettled(
      cachedCurrencyIds.map(id => {
        const currency = findCryptoCurrencyById?.(id);
        return currency ? hydrateCurrency(currency) : Promise.reject();
      }),
    );

    if (
      settingsData &&
      settingsData.counterValue &&
      !supportedCountervalues.find(
        ({ ticker }) => ticker === settingsData.counterValue,
      )
    ) {
      settingsData.counterValue = settingsState.counterValue;
    }

    store.dispatch(importSettings(settingsData));
    const accountsData = await getAccounts();
    store.dispatch(importAccounts(accountsData));

    const postOnboardingState = await getPostOnboardingState();
    if (postOnboardingState) {
      store.dispatch(
        importPostOnboardingState({ newState: postOnboardingState }),
      );
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
    return (
      <Provider store={store}>
        {children(ready, store, initialCountervalues)}
      </Provider>
    );
  }
}
