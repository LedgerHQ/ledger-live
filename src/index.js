// @flow
/* eslint-disable import/first */
import "./polyfill";
import React, { Component } from "react"; // eslint-disable-line import/first
import { createStore, applyMiddleware } from "redux";
import dbMiddleware from "./middlewares/db";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import reducers from "./reducers";
import App, { LoadingApp } from "./App";
import { LocaleProvider } from "./components/LocaleContext";
import { initAccounts } from "./actions/accounts";
import { initSettings } from "./actions/settings";
import { initCounterValues, fetchCounterValues } from "./actions/counterValues";
import { deserializeAccounts } from "./reducers/accounts";
import db from "./db";
import { genAccount } from "./mock/account";

async function injectMockAccountsInDB() {
  await db.save(
    "accounts",
    deserializeAccounts(
      Array(12)
        .fill(null)
        .map((_, i) => genAccount(i))
    )
  );
}

const createLedgerStore = () =>
  createStore(reducers, applyMiddleware(thunk, dbMiddleware));

export default class Root extends Component<
  {},
  {
    store: *,
    ready: boolean
  }
> {
  state = {
    store: createLedgerStore(),
    ready: false
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
    await injectMockAccountsInDB();
    await store.dispatch(initSettings());
    await store.dispatch(initCounterValues());
    await store.dispatch(initAccounts());
    await store.dispatch(fetchCounterValues());
    this.setState({ ready: true });
  }

  render() {
    const { store, ready } = this.state;
    // TODO later we might want to init the stores asynchronously before rendering the App
    return (
      <Provider store={store}>
        <LocaleProvider>{ready ? <App /> : <LoadingApp />}</LocaleProvider>
      </Provider>
    );
  }
}
