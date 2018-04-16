// @flow
/* eslint-disable import/first */
import "./polyfill";
import React, { Component } from "react"; // eslint-disable-line import/first
import { createStore, applyMiddleware, compose } from "redux";
import dbMiddleware from "./middlewares/db";
import db from "./db";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import SplashScreen from "react-native-splash-screen";
import reducers from "./reducers";
import App, { LoadingApp } from "./App";
import { CounterValuePollingProvider } from "./components/CounterValuePolling";
import { LocaleProvider } from "./components/LocaleContext";
import { RebootProvider } from "./components/RebootContext";
import { initAccounts } from "./actions/accounts";
import { initSettings } from "./actions/settings";
import { initCounterValues } from "./actions/counterValues";

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

const INIT_TIMEOUT = 300;

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

  initTimeout: *;

  componentDidMount() {
    return this.init();
  }

  componentWillUnmount() {
    clearTimeout(this.initTimeout);
  }

  componentDidCatch(e: *) {
    console.error(e);
    throw e;
  }

  async init() {
    const { store } = this.state;
    await store.dispatch(initSettings());
    await store.dispatch(initCounterValues());
    await store.dispatch(initAccounts());
    this.setState({ ready: true }, () => {
      this.initTimeout = setTimeout(() => SplashScreen.hide(), INIT_TIMEOUT);
    });
  }

  reboot = async (resetData: boolean = false) => {
    clearTimeout(this.initTimeout);
    SplashScreen.show();
    this.setState({
      store: createLedgerStore(),
      ready: false,
      rebootId: this.state.rebootId + 1
    });
    if (resetData) {
      await db.delete(["settings", "accounts", "countervalues"]);
    }
    return this.init();
  };

  render() {
    const { store, ready, rebootId } = this.state;
    // TODO later we might want to init the stores asynchronously before rendering the App
    return (
      <RebootProvider reboot={this.reboot}>
        <Provider key={rebootId} store={store}>
          <LocaleProvider>
            {ready ? (
              <CounterValuePollingProvider store={store}>
                <App />
              </CounterValuePollingProvider>
            ) : (
              <LoadingApp />
            )}
          </LocaleProvider>
        </Provider>
      </RebootProvider>
    );
  }
}
