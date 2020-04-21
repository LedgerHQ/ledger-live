// @flow
/* eslint-disable import/first */
import "../shim";
import "./polyfill";
import "./live-common-setup";
import "./implement-react-native-libcore";
import React, { Component } from "react";
import { connect } from "react-redux";
import { StyleSheet, View, Text } from "react-native";
import SplashScreen from "react-native-splash-screen";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/lib/sanityChecks";
import logger from "./logger";
import { saveAccounts, saveBle, saveSettings, saveCountervalues } from "./db";
import { exportSelector as settingsExportSelector } from "./reducers/settings";
import { exportSelector as accountsExportSelector } from "./reducers/accounts";
import { exportSelector as bleSelector } from "./reducers/ble";
import CounterValues from "./countervalues";
import LocaleProvider from "./context/Locale";
import RebootProvider from "./context/Reboot";
import ButtonUseTouchable from "./context/ButtonUseTouchable";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import LoadingApp from "./components/LoadingApp";
import StyledStatusBar from "./components/StyledStatusBar";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import DBSave from "./components/DBSave";
import DebugRejectSwitch from "./components/DebugRejectSwitch";
import AppStateListener from "./components/AppStateListener";
import { SyncNewAccounts } from "./bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "./screens/Onboarding/onboardingContext";
import HookAnalytics from "./analytics/HookAnalytics";
import HookSentry from "./components/HookSentry";
import AppContainer from "./navigators";
import SetEnvsFromSettings from "./components/SetEnvsFromSettings";
import type { State } from "./reducers";

checkLibs({
  NotEnoughBalance,
  React,
  log,
  Transport,
  connect,
});

// useScreens();
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

// Fixme until third parties address this themselves
// $FlowFixMe
Text.defaultProps = Text.defaultProps || {};
// $FlowFixMe
Text.defaultProps.allowFontScaling = false;

class App extends Component<*> {
  getCountervaluesChanged = (a, b) => a.countervalues !== b.countervalues;

  getSettingsChanged = (a, b) => a.settings !== b.settings;

  getAccountsChanged = (
    oldState: State,
    newState: State,
  ): ?{ changed: string[] } => {
    if (oldState.accounts !== newState.accounts) {
      return {
        changed: newState.accounts.active
          .filter(a => {
            const old = oldState.accounts.active.find(b => a.id === b.id);
            return !old || old !== a;
          })
          .map(a => a.id),
      };
    }
    return null;
  };

  getBleChanged = (a, b) => a.ble !== b.ble;

  render() {
    return (
      <View style={styles.root}>
        <DBSave
          save={saveCountervalues}
          throttle={2000}
          getChangesStats={this.getCountervaluesChanged}
          lense={CounterValues.exportSelector}
        />
        <DBSave
          save={saveSettings}
          throttle={400}
          getChangesStats={this.getSettingsChanged}
          lense={settingsExportSelector}
        />
        <DBSave
          save={saveAccounts}
          throttle={500}
          getChangesStats={this.getAccountsChanged}
          lense={accountsExportSelector}
        />
        <DBSave
          save={saveBle}
          throttle={500}
          getChangesStats={this.getBleChanged}
          lense={bleSelector}
        />

        <AppStateListener />

        <SyncNewAccounts priority={5} />

        <AppContainer
          screenProps={{
            importDataString: this.props.importDataString,
          }}
        />

        <DebugRejectSwitch />
      </View>
    );
  }
}

export default class Root extends Component<
  { importDataString?: string },
  { appState: * },
> {
  initTimeout: *;

  componentWillUnmount() {
    clearTimeout(this.initTimeout);
  }

  componentDidCatch(e: *) {
    logger.critical(e);
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
    const importDataString = __DEV__ && this.props.importDataString;

    return (
      <RebootProvider onRebootStart={this.onRebootStart}>
        <LedgerStoreProvider onInitFinished={this.onInitFinished}>
          {(ready, store) =>
            ready ? (
              <>
                <StyledStatusBar />
                <SetEnvsFromSettings />
                <HookSentry />
                <HookAnalytics store={store} />
                <AuthPass>
                  <LocaleProvider>
                    <BridgeSyncProvider>
                      <CounterValues.PollingProvider>
                        <ButtonUseTouchable.Provider value={true}>
                          <OnboardingContextProvider>
                            <App importDataString={importDataString} />
                          </OnboardingContextProvider>
                        </ButtonUseTouchable.Provider>
                      </CounterValues.PollingProvider>
                    </BridgeSyncProvider>
                  </LocaleProvider>
                </AuthPass>
              </>
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
