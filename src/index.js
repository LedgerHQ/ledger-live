// @flow
import "../shim";
import "./polyfill";
import "./live-common-setup";
import "./implement-react-native-libcore";
import "react-native-gesture-handler";
import React, { Component, useCallback, useContext, useMemo } from "react";
import { connect, useSelector } from "react-redux";
import { StyleSheet, View, Text, Linking } from "react-native";
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
import _ from "lodash";
import { useCountervaluesExport } from "@ledgerhq/live-common/lib/countervalues/react";
import { pairId } from "@ledgerhq/live-common/lib/countervalues/helpers";
import logger from "./logger";
import { saveAccounts, saveBle, saveSettings, saveCountervalues } from "./db";
import {
  exportSelector as settingsExportSelector,
  hasCompletedOnboardingSelector,
  themeSelector,
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
import ThemeDebug from "./components/ThemeDebug";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import useDBSaveEffect from "./components/DBSave";
import DebugRejectSwitch from "./components/DebugRejectSwitch";
import useAppStateListener from "./components/useAppStateListener";
import SyncNewAccounts from "./bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "./screens/Onboarding/onboardingContext";
import WalletConnectProvider, {
  context as _wcContext,
} from "./screens/WalletConnect/Provider";
import HookAnalytics from "./analytics/HookAnalytics";
import HookSentry from "./components/HookSentry";
import RootNavigator from "./components/RootNavigator";
import SetEnvsFromSettings from "./components/SetEnvsFromSettings";
import CounterValuesProvider from "./components/CounterValuesProvider";
import type { State } from "./reducers";
import { navigationRef } from "./rootnavigation";
import { useTrackingPairs } from "./actions/general";
import { ScreenName, NavigatorName } from "./const";
import { lightTheme, duskTheme, darkTheme } from "./colors";

const themes = {
  light: lightTheme,
  dusk: duskTheme,
  dark: darkTheme,
};

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
  const trackingPairs = useTrackingPairs();
  const pairIds = useMemo(() => trackingPairs.map(p => pairId(p)), [
    trackingPairs,
  ]);

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
      <ThemeDebug />
    </View>
  );
}

/*
Monkey patching Linking in order to transform wc: schemes to ledgerlive schemes in order
to play correctly with react navigation.
*/

const fixURL = url => {
  let NEWurl = url;
  if (url.substr(0, 3) === "wc:") {
    NEWurl = `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }
  return NEWurl;
};

const OGgetInitialURL = Linking.getInitialURL.bind(Linking);
Linking.getInitialURL = () => OGgetInitialURL().then(fixURL);

const NEWcallbacks = [];
const OGcallbacks = [];
const OGaddEventListener = Linking.addEventListener.bind(Linking);
const OGremoveEventListener = Linking.removeEventListener.bind(Linking);
Linking.addEventListener = (evt, OGcallback) => {
  let NEWcallback = OGcallback;
  if (evt === "url") {
    NEWcallback = ({ url }) => OGcallback({ url: fixURL(url) });
    OGcallbacks.push(OGcallback);
    NEWcallbacks.push(NEWcallback);
  }
  return OGaddEventListener(evt, NEWcallback);
};
Linking.removeEventListener = (evt, OGcallback) => {
  let NEWcallback = OGcallback;
  if (evt === "url") {
    const index = _.findLastIndex(OGcallbacks, OGcallback);
    NEWcallback = NEWcallbacks[index];
    _.pull(NEWcallbacks, NEWcallback);
    _.pull(OGcallbacks, OGcallback);
  }
  return OGremoveEventListener(evt, NEWcallback);
};

// DeepLinking
const linking = {
  prefixes: ["ledgerlive://"],
  config: {
    [NavigatorName.Base]: {
      initialRouteName: NavigatorName.Main,
      screens: {
        /**
         * @params ?uri: string
         * ie: "ledgerhq://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae
         */
        [ScreenName.WalletConnectDeeplinkingSelectAccount]: "wc",
        [NavigatorName.Main]: {
          /**
           * ie: "ledgerhq://portfolio" -> will redirect to the portfolio
           */
          initialRouteName: ScreenName.Portfolio,
          screens: {
            [ScreenName.Portfolio]: "portfolio",
            [NavigatorName.Accounts]: {
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
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerhq://receive?currency=bitcoin" will open the prefilled search account in the receive flow
             */
            [ScreenName.ReceiveSelectAccount]: "receive",
          },
        },
        [NavigatorName.SendFunds]: {
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerhq://send?currency=bitcoin" will open the prefilled search account in the send flow
             */
            [ScreenName.SendFundsMain]: "send",
          },
        },
        [NavigatorName.ExchangeBuyFlow]: {
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
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const wcContext = useContext(_wcContext);

  const enabled =
    hasCompletedOnboarding && wcContext.initDone && !wcContext.session.session;

  const { getInitialState } = useLinking(navigationRef, {
    ...linking,
    getStateFromPath(path, config) {
      if (!enabled) {
        // Our current version of react navigation does not support the enable param
        return null;
      }
      return getStateFromPath(path, config);
    },
  });

  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    if (!wcContext.initDone) {
      return;
    }
    getInitialState()
      .catch(() => {
        setIsReady(true);
      })
      .then(state => {
        if (state) {
          setInitialState(state);
        }

        setIsReady(true);
      });
  }, [getInitialState, wcContext.initDone]);

  const theme = useSelector(themeSelector);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      theme={themes[theme]}
      initialState={initialState}
      ref={navigationRef}
    >
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
          {(ready, store, initialCountervalues) =>
            ready ? (
              <>
                <SetEnvsFromSettings />
                <HookSentry />
                <HookAnalytics store={store} />
                <WalletConnectProvider>
                  <DeepLinkingNavigator>
                    <SafeAreaProvider>
                      <AuthPass>
                        <StyledStatusBar />
                        <I18nextProvider i18n={i18n}>
                          <LocaleProvider>
                            <BridgeSyncProvider>
                              <CounterValuesProvider
                                initialState={initialCountervalues}
                              >
                                <ButtonUseTouchable.Provider value={true}>
                                  <OnboardingContextProvider>
                                    <App importDataString={importDataString} />
                                  </OnboardingContextProvider>
                                </ButtonUseTouchable.Provider>
                              </CounterValuesProvider>
                            </BridgeSyncProvider>
                          </LocaleProvider>
                        </I18nextProvider>
                      </AuthPass>
                    </SafeAreaProvider>
                  </DeepLinkingNavigator>
                </WalletConnectProvider>
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
