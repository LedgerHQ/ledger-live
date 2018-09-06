// @flow
import "./polyfill"; /* eslint-disable import/first */
import React, { Component } from "react";
import { StyleSheet, View, StatusBar, Platform } from "react-native";
import SplashScreen from "react-native-splash-screen";
import colors from "./colors";
import { exportSelector as settingsExportSelector } from "./reducers/settings";
import { exportSelector as accountsExportSelector } from "./reducers/accounts";
import CounterValues from "./countervalues";
import LocaleProvider from "./context/Locale";
import RebootProvider from "./context/Reboot";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import { RootNavigator } from "./navigators";
import AuthFailedApp from "./components/AuthFailedApp";
import AuthPendingApp from "./components/AuthPendingApp";
import LoadingApp from "./components/LoadingApp";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import DBSave from "./components/DBSave";

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
    const ColoredBar =
      Platform.OS === "android" && Platform.Version < 23 ? null : (
        <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      );

    return (
      <View style={styles.root}>
        {ColoredBar}

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
                          <App />
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
