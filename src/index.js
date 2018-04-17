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
import App, { LoadingApp, NoAuthApp } from "./App";
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

class AuthPass extends Component<
  {
    enabled?: boolean,
    children: (success: boolean) => *
  },
  {
    success: boolean
  }
> {
  state = {
    success: !this.props.enabled
  };
  componentDidMount() {
    if (!this.state.success) {
      // TODO replace by the actual auth we will do
      console.log("simulate auth");
      setTimeout(() => {
        this.setState({ success: true });
      }, 1000);
    }
  }
  render() {
    const { children } = this.props;
    const { success } = this.state;
    return children(success);
  }
}

class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void,
    children: (ready: boolean) => *
  },
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
    await store.dispatch(initSettings());
    await store.dispatch(initCounterValues());
    await store.dispatch(initAccounts());
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

export default class Root extends Component<
  {},
  {
    rebootId: number
  }
> {
  state = {
    rebootId: 0
  };

  initTimeout: *;

  componentWillUnmount() {
    clearTimeout(this.initTimeout);
  }

  componentDidCatch(e: *) {
    console.error(e);
    throw e;
  }

  onInitFinished = () => {
    this.initTimeout = setTimeout(() => SplashScreen.hide(), 300);
  };

  reboot = async (resetData: boolean = false) => {
    clearTimeout(this.initTimeout);
    SplashScreen.show();
    this.setState({
      rebootId: this.state.rebootId + 1
    });
    if (resetData) {
      await db.delete(["settings", "accounts", "countervalues"]);
    }
  };

  render() {
    const { rebootId } = this.state;
    const authRequired = false; // TODO this should be opt-in from settings
    return (
      <RebootProvider reboot={this.reboot}>
        <LedgerStoreProvider
          key={rebootId /* force LedgerStoreProvider to remount */}
          onInitFinished={this.onInitFinished}
        >
          {ready => (
            <AuthPass enabled={authRequired}>
              {authenticated =>
                !authenticated ? (
                  <NoAuthApp />
                ) : (
                  <LocaleProvider>
                    {ready ? (
                      <CounterValuePollingProvider>
                        <App />
                      </CounterValuePollingProvider>
                    ) : (
                      <LoadingApp />
                    )}
                  </LocaleProvider>
                )
              }
            </AuthPass>
          )}
        </LedgerStoreProvider>
      </RebootProvider>
    );
  }
}
