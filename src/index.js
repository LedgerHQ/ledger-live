// @flow
/* eslint-disable import/first */
import "./polyfill";
import React, { Component } from "react";
import SplashScreen from "react-native-splash-screen";
import App, { LoadingApp, NoAuthApp } from "./App";
import CounterValuePollingProvider from "./context/CounterValuePolling";
import LocaleProvider from "./context/Locale";
import RebootProvider from "./context/Reboot";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";

export default class Root extends Component<{}, {}> {
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

  onRebootStart = () => {
    clearTimeout(this.initTimeout);
    if (SplashScreen.show) SplashScreen.show(); // on iOS it seems to not be exposed
  };

  render() {
    const authRequired = false; // TODO this should be opt-in from settings
    return (
      <RebootProvider onRebootStart={this.onRebootStart}>
        <LedgerStoreProvider onInitFinished={this.onInitFinished}>
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
