// @flow

import React, { Component } from "react";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { createStore, applyMiddleware, compose } from "redux";
import { getAccounts, getCountervalues, getSettings, getBle } from "../db";
import reducers from "../reducers";
import { importSettings } from "../actions/settings";
import { importStore as importAccounts } from "../actions/accounts";
import { importBle } from "../actions/ble";
import { INITIAL_STATE, supportedCountervalues } from "../reducers/settings";

const createLedgerStore = () =>
  createStore(
    reducers,
    undefined,
    // $FlowFixMe
    compose(
      applyMiddleware(thunk),
      typeof __REDUX_DEVTOOLS_EXTENSION__ === "function"
        ? __REDUX_DEVTOOLS_EXTENSION__()
        : f => f,
    ),
  );

export default class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void,
    children: (ready: boolean, store: *, initialCountervalues: *) => *,
  },
  {
    store: *,
    ready: boolean,
    initialCountervalues: *,
  },
> {
  state = {
    store: createLedgerStore(),
    ready: false,
    initialCountervalues: undefined,
  };

  componentDidMount() {
    return this.init();
  }

  componentDidCatch(e: *) {
    console.error(e);
    throw e;
  }

  async init() {
    const { store } = this.state;

    const bleData = await getBle();
    store.dispatch(importBle(bleData));

    const settingsData = await getSettings();
    if (
      settingsData &&
      settingsData.counterValue &&
      !supportedCountervalues.find(
        ({ ticker }) => ticker === settingsData.counterValue,
      )
    ) {
      settingsData.counterValue = INITIAL_STATE.counterValue;
    }
    store.dispatch(importSettings(settingsData));

    const accountsData = await getAccounts();
    store.dispatch(importAccounts(accountsData));

    const initialCountervalues = await getCountervalues();

    this.setState({ ready: true, initialCountervalues }, () => {
      this.props.onInitFinished();
    });
  }

  render() {
    const { children } = this.props;
    const { store, ready, initialCountervalues } = this.state;
    return (
      <Provider store={store}>
        {children(ready, store, initialCountervalues)}
      </Provider>
    );
  }
}
