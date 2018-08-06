// @flow

import React, { Component } from "react";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { createStore, applyMiddleware, compose } from "redux";
import dbMiddleware from "../middlewares/db";
import db from "../db";
import CounterValues from "../countervalues";
import reducers from "../reducers";
import { importSettings } from "../actions/settings";
import { importStore as importAccounts } from "../actions/accounts";

const createLedgerStore = () =>
  createStore(
    reducers,
    undefined,
    // $FlowFixMe
    compose(
      applyMiddleware(thunk, dbMiddleware),
      typeof __REDUX_DEVTOOLS_EXTENSION__ === "function"
        ? __REDUX_DEVTOOLS_EXTENSION__()
        : f => f,
    ),
  );

export default class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void,
    children: (ready: boolean) => *,
  },
  {
    store: *,
    ready: boolean,
  },
> {
  state = {
    store: createLedgerStore(),
    ready: false,
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

    const settingsData = await db.get("settings");
    store.dispatch(importSettings(settingsData));

    const accountsData = await db.get("accounts");
    store.dispatch(importAccounts(accountsData));

    const countervaluesData = await db.get("countervalues");
    store.dispatch(CounterValues.importAction(countervaluesData));

    this.setState({ ready: true }, () => {
      this.props.onInitFinished();
    });
  }

  render() {
    const { children } = this.props;
    const { store, ready } = this.state;
    return <Provider store={store}>{children(ready)}</Provider>;
  }
}
