// @flow
import "../shim";
import "./polyfill";
import "./live-common-setup";
import "./implement-react-native-libcore";
import "react-native-gesture-handler";
import React, { Component, useCallback } from "react";
import { connect, useSelector } from "react-redux";
import { StyleSheet, View, Text } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import {
  useLinking,
  NavigationContainer,
  getStateFromPath,
} from "@react-navigation/native";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/lib/sanityChecks";
import { useCountervaluesExport } from "@ledgerhq/live-common/lib/countervalues/react";
import logger from "./logger";
import { saveAccounts, saveBle, saveSettings, saveCountervalues } from "./db";
import {
  exportSelector as settingsExportSelector,
  hasCompletedOnboardingSelector,
} from "./reducers/settings";
import { exportSelector as accountsExportSelector } from "./reducers/accounts";
import { exportSelector as bleSelector } from "./reducers/ble";
import LocaleProvider, { i18n } from "./context/Locale";
import RebootProvider from "./context/Reboot";
import ButtonUseTouchable from "./context/ButtonUseTouchable";
import AuthPass from "./context/AuthPass";
import LedgerStoreProvider from "./context/LedgerStore";
import LoadingApp from "./components/LoadingApp";
import StyledStatusBar from "./components/StyledStatusBar";
import AnalyticsConsole from "./components/AnalyticsConsole";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import useDBSaveEffect from "./components/DBSave";
import DebugRejectSwitch from "./components/DebugRejectSwitch";
import useAppStateListener from "./components/useAppStateListener";
import SyncNewAccounts from "./bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "./screens/Onboarding/onboardingContext";
import HookAnalytics from "./analytics/HookAnalytics";
import HookSentry from "./components/HookSentry";
import RootNavigator from "./components/RootNavigator";
import SetEnvsFromSettings from "./components/SetEnvsFromSettings";
import CounterValuesProvider from "./components/CounterValuesProvider";
import type { State } from "./reducers";
import { useTrackingPairIds } from "./actions/general";
import { ScreenName, NavigatorName } from "./const";

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
  importDataString?: string,
};

function App({ importDataString }: AppProps) {
  useAppStateListener();

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

  const rawState = useCountervaluesExport();
  const pairIds = useTrackingPairIds();

  useDBSaveEffect({
    save: saveCountervalues,
    throttle: 2000,
    getChangesStats: () => ({
      changed: !!Object.keys(rawState.status).length,
      pairIds,
    }),
    lense: () => rawState,
  });

  useDBSaveEffect({
    save: saveSettings,
    throttle: 400,
    getChangesStats: getSettingsChanged,
    lense: settingsExportSelector,
  });

  useDBSaveEffect({
    save: saveAccounts,
    throttle: 500,
    getChangesStats: getAccountsChanged,
    lense: accountsExportSelector,
  });

  useDBSaveEffect({
    save: saveBle,
    throttle: 500,
    getChangesStats: (a, b) => a.ble !== b.ble,
    lense: bleSelector,
  });

  return (
    <View style={styles.root}>
      <SyncNewAccounts priority={5} />

      <RootNavigator importDataString={importDataString} />

      <DebugRejectSwitch />

      <AnalyticsConsole />
    </View>
  );
}

// DeepLinking
const linking = {
  prefixes: ["ledgerlive://"],
  config: {
    [NavigatorName.Base]: {
      path: "",
      initialRouteName: NavigatorName.Main,
      screens: {
        [NavigatorName.Main]: {
          path: "",
          /**
           * ie: "ledgerhq://portfolio" -> will redirect to the portfolio
           */
          initialRouteName: ScreenName.Portfolio,
          screens: {
            [ScreenName.Portfolio]: "portfolio",
            [NavigatorName.Accounts]: {
              path: "",
              screens: {
                /**
                 * @params ?currency: string
                 * ie: "ledgerhq://account?currency=bitcoin" will open the first bitcoin account
                 */
                [ScreenName.Accounts]: "account",
              },
            },
          },
        },
        [NavigatorName.ReceiveFunds]: {
          path: "",
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerhq://receive?currency=bitcoin" will open the prefilled search account in the receive flow
             */
            [ScreenName.ReceiveSelectAccount]: "receive",
          },
        },
        [NavigatorName.SendFunds]: {
          path: "",
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerhq://send?currency=bitcoin" will open the prefilled search account in the send flow
             */
            [ScreenName.SendFundsMain]: "send",
          },
        },
        [NavigatorName.ExchangeBuyFlow]: {
          path: "",
          screens: {
            /**
             * @params currency: string
             * ie: "ledgerhq://buy/bitcoin" -> will redirect to the prefilled search currency in the buy crypto flow
             */
            [ScreenName.ExchangeSelectCurrency]: "buy/:currency",
          },
        },
        /**
         * ie: "ledgerhq://buy" -> will redirect to the main exchange page
         */
        [NavigatorName.Exchange]: "buy",
      },
    },
  },
};

const DeepLinkingNavigator = ({ children }: { children: React$Node }) => {
  const ref = React.useRef();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const { getInitialState } = useLinking(ref, {
    ...linking,
    enabled: hasCompletedOnboarding,
    getStateFromPath(path, config) {
      // Return a state object here
      // You can also reuse the default logic by importing `getStateFromPath` from `@react-navigation/native`
      const state = getStateFromPath(path, config);
      return hasCompletedOnboarding ? state : null;
    },
  });

  /** we consider the state is ready during onboarding no need to get it from deeplinking */
  const [isReady, setIsReady] = React.useState(!hasCompletedOnboarding);
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    if (hasCompletedOnboarding)
      getInitialState()
        .catch(() => {
          setIsReady(true);
        })
        .then(state => {
          if (state !== undefined) {
            setInitialState(state);
          }

          setIsReady(true);
        });
  }, [getInitialState, hasCompletedOnboarding]);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer initialState={initialState} ref={ref}>
      {children}
    </NavigationContainer>
  );
};

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
    const importDataString = __DEV__ ? this.props.importDataString : "";

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
                    <DeepLinkingNavigator>
                      <I18nextProvider i18n={i18n}>
                        <LocaleProvider>
                          <BridgeSyncProvider>
                            <CounterValuesProvider>
                              <ButtonUseTouchable.Provider value={true}>
                                <OnboardingContextProvider>
                                  <App importDataString={importDataString} />
                                </OnboardingContextProvider>
                              </ButtonUseTouchable.Provider>
                            </CounterValuesProvider>
                          </BridgeSyncProvider>
                        </LocaleProvider>
                      </I18nextProvider>
                    </DeepLinkingNavigator>
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
