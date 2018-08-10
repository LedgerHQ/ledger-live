// @flow
import "./polyfill"; /* eslint-disable import/first */
import React, { Component } from "react";
import { StyleSheet, View, StatusBar, Platform } from "react-native";
import SplashScreen from "react-native-splash-screen";
import colors from "./colors";
import CounterValues from "./countervalues";
import LocaleProvider from "./context/Locale";
import RebootProvider from "./context/Reboot";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import { RootNavigator } from "./navigators";
import AuthFailedApp from "./components/AuthFailedApp";
import AuthPendingApp from "./components/AuthPendingApp";
import LoadingApp from "./components/LoadingApp";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

class App extends Component<*> {
  render() {
    const ColoredBar =
      Platform.OS === "android" && Platform.Version < 23 ? null : (
        <StatusBar backgroundColor={colors.lightGrey} barStyle="dark-content" />
      );

    return (
      <View style={styles.root}>
        {ColoredBar}
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
                      <CounterValues.PollingProvider>
                        <App />
                      </CounterValues.PollingProvider>
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
