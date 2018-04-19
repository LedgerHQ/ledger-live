// @flow
import "./polyfill"; /* eslint-disable import/first */
import React, { Component, PureComponent } from "react";
import { StyleSheet, View, StatusBar } from "react-native";
import SplashScreen from "react-native-splash-screen";
import colors from "./colors";
import CounterValuePollingProvider from "./context/CounterValuePolling";
import LocaleProvider from "./context/Locale";
import RebootProvider from "./context/Reboot";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import { RootNavigator } from "./navigators";
import AuthFailedApp from "./components/AuthFailedApp";
import AuthPendingApp from "./components/AuthPendingApp";

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});

class App extends Component<*> {
  render() {
    return (
      <View style={styles.root}>
        <StatusBar backgroundColor={colors.blue} />
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
                      <CounterValuePollingProvider>
                        <App />
                      </CounterValuePollingProvider>
                    </LocaleProvider>
                  )
                }
              </AuthPass>
            ) : (
              <View />
            )
          }
        </LedgerStoreProvider>
      </RebootProvider>
    );
  }
}
