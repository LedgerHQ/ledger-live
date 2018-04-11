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
import { AppState } from "react-native";
import throttle from "lodash/throttle";

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
    AppState.addEventListener("change", this.handleAppStateChange);
    return this.init();
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
    clearInterval(this.interval);
  }

  componentDidCatch(e: *) {
    console.error(e);
    throw e;
  }

  poll = throttle(() => {
    const { store } = this.state;
    store.dispatch(fetchCounterValuesLatest());
  }, 30000);

  initPolling = () => {
    clearInterval(this.interval);
    this.interval = setInterval(this.poll, 120000);
    this.poll();
  };

  handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === "active") {
      this.initPolling();
    } else {
      clearInterval(this.interval);
    }
  };

  async init() {
    const { store } = this.state;
    await store.dispatch(initSettings());
    await store.dispatch(initCounterValues());
    await store.dispatch(initAccounts());
    await store.dispatch(fetchCounterValuesHist());
    this.setState({ ready: true });
    this.initPolling();
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
