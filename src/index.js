// @flow
import "../shim";
import "./polyfill"; /* eslint-disable import/first */
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { useScreens } from "react-native-screens";
import SplashScreen from "react-native-splash-screen";
import { exportSelector as settingsExportSelector } from "./reducers/settings";
import { exportSelector as accountsExportSelector } from "./reducers/accounts";
import CounterValues from "./countervalues";
import LocaleProvider from "./context/Locale";
import RebootProvider from "./context/Reboot";
import ButtonUseTouchable from "./context/ButtonUseTouchable";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import { RootNavigator } from "./navigators";
import AuthFailedApp from "./components/AuthFailedApp";
import AuthPendingApp from "./components/AuthPendingApp";
import LoadingApp from "./components/LoadingApp";
import StyledStatusBar from "./components/StyledStatusBar";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import DBSave from "./components/DBSave";
import AppStateListener from "./components/AppStateListener";
import SyncNewAccounts from "./bridge/SyncNewAccounts";

useScreens();

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

class App extends Component<*> {
  hasCountervaluesChanged = (a, b) => a.countervalues !== b.countervalues;

  hasSettingsChanged = (a, b) => a.settings !== b.settings;

  hasAccountsChanged = (a, b) => a.accounts !== b.accounts;

  render() {
    return (
      <View style={styles.root}>
        <StyledStatusBar />

        <DBSave
          dbKey="countervalues"
          throttle={2000}
          hasChanged={this.hasCountervaluesChanged}
          lense={CounterValues.exportSelector}
        />
        <DBSave
          dbKey="settings"
          throttle={400}
          hasChanged={this.hasSettingsChanged}
          lense={settingsExportSelector}
        />
        <DBSave
          dbKey="accounts"
          throttle={500}
          hasChanged={this.hasAccountsChanged}
          lense={accountsExportSelector}
        />

        <AppStateListener />

        <SyncNewAccounts priority={5} />

        <RootNavigator />
      </View>
    );
  }
}

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
    return (
      <RebootProvider onRebootStart={this.onRebootStart}>
        <LedgerStoreProvider onInitFinished={this.onInitFinished}>
          {ready =>
            ready ? (
              <AuthPass>
                {state =>
                  state.pending ? (
                    <AuthPendingApp />
                  ) : !state.success ? (
                    <AuthFailedApp />
                  ) : (
                    <LocaleProvider>
                      <BridgeSyncProvider>
                        <CounterValues.PollingProvider>
                          <ButtonUseTouchable.Provider value={false}>
                            <App />
                          </ButtonUseTouchable.Provider>
                        </CounterValues.PollingProvider>
                      </BridgeSyncProvider>
                    </LocaleProvider>
                  )
                }
              </AuthPass>
            ) : (
              <LoadingApp />
            )
          }
        </LedgerStoreProvider>
      </RebootProvider>
    );
  }
}

if (__DEV__) {
  require("./snoopy");
}
