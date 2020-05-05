// @flow
import "../shim";
import "./polyfill";
import "./live-common-setup";
import "./implement-react-native-libcore";
import "react-native-gesture-handler";
import React, { Component, useCallback } from "react";
import { connect } from "react-redux";
import { StyleSheet, View, Text } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import { NavigationContainer } from "@react-navigation/native";
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
import LocaleProvider, { i18n } from "./context/Locale";
import RebootProvider from "./context/Reboot";
import ButtonUseTouchable from "./context/ButtonUseTouchable";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import LoadingApp from "./components/LoadingApp";
import StyledStatusBar from "./components/StyledStatusBar";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import DBSave from "./components/DBSave";
import DebugRejectSwitch from "./components/DebugRejectSwitch";
import useAppStateListener from "./components/useAppStateListener";
import SyncNewAccounts from "./bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "./screens/Onboarding/onboardingContext";
import HookAnalytics from "./analytics/HookAnalytics";
import HookSentry from "./components/HookSentry";
import RootNavigator from "./components/RootNavigator";
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

type AppProps = {
  importDataString: boolean,
};

function App({ importDataString }: AppProps) {
  useAppStateListener();

  const getCountervaluesChanged = useCallback(
    (a, b) => a.countervalues !== b.countervalues,
    [],
  );

  const getSettingsChanged = useCallback(
    (a, b) => a.settings !== b.settings,
    [],
  );

  const getAccountsChanged = useCallback((oldState: State, newState: State): ?{
    changed: string[],
  } => {
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
  }, []);

  const getBleChanged = (a, b) => a.ble !== b.ble;

  return (
    <View style={styles.root}>
      <DBSave
        save={saveCountervalues}
        throttle={2000}
        getChangesStats={getCountervaluesChanged}
        lense={CounterValues.exportSelector}
      />
      <DBSave
        save={saveSettings}
        throttle={400}
        getChangesStats={getSettingsChanged}
        lense={settingsExportSelector}
      />
      <DBSave
        save={saveAccounts}
        throttle={500}
        getChangesStats={getAccountsChanged}
        lense={accountsExportSelector}
      />
      <DBSave
        save={saveBle}
        throttle={500}
        getChangesStats={getBleChanged}
        lense={bleSelector}
      />

      <SyncNewAccounts priority={5} />

      <RootNavigator importDataString={importDataString} />

      <DebugRejectSwitch />
    </View>
  );
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
                <SafeAreaProvider>
                  <AuthPass>
                    <NavigationContainer>
                      <I18nextProvider i18n={i18n}>
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
                      </I18nextProvider>
                    </NavigationContainer>
                  </AuthPass>
                </SafeAreaProvider>
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
