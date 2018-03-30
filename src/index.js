// @flow
/* eslint-disable import/first */
import "./polyfill";
import React, { Component } from "react"; // eslint-disable-line import/first
import { createStore, applyMiddleware, compose } from "redux";
import dbMiddleware from "./middlewares/db";
import db from "./db";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import reducers from "./reducers";
import App, { LoadingApp } from "./App";
import { LocaleProvider } from "./components/LocaleContext";
import { RebootProvider } from "./components/RebootContext";
import { initAccounts } from "./actions/accounts";
import { initSettings } from "./actions/settings";
import {
  initCounterValues,
  fetchCounterValuesHist,
  fetchCounterValuesLatest
} from "./actions/counterValues";

const createLedgerStore = () =>
  createStore(
    reducers,
    undefined,
    compose(
      applyMiddleware(thunk, dbMiddleware),
      typeof __REDUX_DEVTOOLS_EXTENSION__ === "function"
        ? __REDUX_DEVTOOLS_EXTENSION__()
        : f => f
    )
  );

export default class Root extends Component<
  {},
  {
    store: *,
    ready: boolean,
    rebootId: number
  }
> {
  state = {
    store: createLedgerStore(),
    ready: false,
    rebootId: 0
  };
  interval: *;

  componentDidMount() {
    return this.init();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }
  componentDidCatch(e: *) {
    console.error(e);
    throw e;
  }

  startCounterValuePolling = () => {
    const { store } = this.state;
    this.interval = setInterval(() => {
      store.dispatch(fetchCounterValuesLatest());
    }, 60000);
  };

  async init() {
    const { store } = this.state;
    await store.dispatch(initSettings());
    await store.dispatch(initCounterValues());
    await store.dispatch(initAccounts());
    await store.dispatch(fetchCounterValuesHist());
    store.dispatch(fetchCounterValuesLatest());
    this.setState({ ready: true });
    this.startCounterValuePolling();
  }

  reboot = async (resetData: boolean = false) => {
    clearInterval(this.interval);
    if (resetData) {
      await db.delete(["settings", "accounts", "countervalues"]);
    }
    this.setState({
      store: createLedgerStore(),
      ready: false,
      rebootId: this.state.rebootId + 1
    });
    return this.init();
  };

  render() {
    const { store, ready, rebootId } = this.state;
    // TODO later we might want to init the stores asynchronously before rendering the App
    return (
      <RebootProvider reboot={this.reboot}>
        <Provider key={rebootId} store={store}>
          <LocaleProvider>{ready ? <App /> : <LoadingApp />}</LocaleProvider>
        </Provider>
      </RebootProvider>
    );
  }
}
