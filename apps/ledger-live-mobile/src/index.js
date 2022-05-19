/* eslint-disable import/no-unresolved */
// @flow
import "./polyfill";
import "./live-common-setup";
import "../e2e/e2e-bridge-setup";
import "react-native-gesture-handler";
import React, {
  Component,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import {
  StyleSheet,
  View,
  Text,
  Linking,
  Appearance,
  AppState,
} from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import { NavigationContainer } from "@react-navigation/native";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/lib/sanityChecks";
import { useCountervaluesExport } from "@ledgerhq/live-common/lib/countervalues/react";
import { pairId } from "@ledgerhq/live-common/lib/countervalues/helpers";

import { NftMetadataProvider } from "@ledgerhq/live-common/lib/nft";
import { ToastProvider } from "@ledgerhq/live-common/lib/notifications/ToastProvider";
import { PlatformAppProvider } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider";
import { getProvider } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider/providers";

import logger from "./logger";
import { saveAccounts, saveBle, saveSettings, saveCountervalues } from "./db";
import {
  exportSelector as settingsExportSelector,
  hasCompletedOnboardingSelector,
  osThemeSelector,
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
import useAppStateListener from "./components/useAppStateListener";
import SyncNewAccounts from "./bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "./screens/Onboarding/onboardingContext";
import WalletConnectProvider, {
  // $FlowFixMe
  context as _wcContext,
} from "./screens/WalletConnect/Provider";
import HookAnalytics from "./analytics/HookAnalytics";
import HookSentry from "./components/HookSentry";
import RootNavigator from "./components/RootNavigator";
import SetEnvsFromSettings from "./components/SetEnvsFromSettings";
import CounterValuesProvider from "./components/CounterValuesProvider";
import type { State } from "./reducers";
import { navigationRef, isReadyRef } from "./rootnavigation";
import { useTrackingPairs } from "./actions/general";
import { ScreenName, NavigatorName } from "./const";
import ExperimentalHeader from "./screens/Settings/Experimental/ExperimentalHeader";
import { lightTheme, darkTheme } from "./colors";
import NotificationsProvider from "./screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "./screens/NotificationCenter/Snackbar/SnackbarContainer";
import NavBarColorHandler from "./components/NavBarColorHandler";
import { setOsTheme } from "./actions/settings";
// $FlowFixMe
import { FirebaseRemoteConfigProvider } from "./components/FirebaseRemoteConfig";
// $FlowFixMe
import { FirebaseFeatureFlagsProvider } from "./components/FirebaseFeatureFlags";
// $FlowFixMe
import StyleProvider from "./StyleProvider";
// $FlowFixMe
import MarketDataProvider from "./screens/Market/MarketDataProviderWrapper";
import AdjustProvider from "./components/AdjustProvider";

const themes = {
  light: lightTheme,
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
      <ExperimentalHeader />

      <RootNavigator importDataString={importDataString} />

      <AnalyticsConsole />
      <ThemeDebug />
    </View>
  );
}

function getProxyURL(url: ?string) {
  if (typeof url === "string" && url.substr(0, 3) === "wc:") {
    return `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }

  return url;
}

// DeepLinking
const linkingOptions = {
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return getProxyURL(url);
  },
  subscribe(listener) {
    function onReceiveURL({ url: _url }: { url: string }) {
      const url = getProxyURL(_url);
      listener(url);
    }

    Linking.addEventListener("url", onReceiveURL);

    return () => {
      // Clean up the event listeners
      Linking.removeEventListener("url", onReceiveURL);
    };
  },
  prefixes: ["ledgerlive://"],
};

// Deep linking screens config available only for users that have already been onboarded
const alreadyOnboardedLinkingConfigScreens = {
  screens: {
    [NavigatorName.Base]: {
      initialRouteName: NavigatorName.Main,
      screens: {
        /**
         * @params ?uri: string
         * ie: "ledgerlive://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae
         */
        [ScreenName.WalletConnectDeeplinkingSelectAccount]: "wc",
        [NavigatorName.Main]: {
          initialRouteName: ScreenName.Portfolio,
          screens: {
            /**
             * ie: "ledgerlive://portfolio" -> will redirect to the portfolio
             */
            [NavigatorName.Portfolio]: {
              screens: {
                [ScreenName.Portfolio]: "portfolio",
                [NavigatorName.PortfolioAccounts]: {
                  screens: {
                    /**
                     * @params ?currency: string
                     * ie: "ledgerlive://account?currency=bitcoin" will open the first bitcoin account
                     */
                    [ScreenName.Accounts]: "account",
                  },
                },
              },
            },
            [NavigatorName.Market]: {
              screens: {
                /**
                 * @params ?platform: string
                 * ie: "ledgerlive://discover" will open the catalog
                 * ie: "ledgerlive://discover/paraswap?theme=light" will open the catalog and the paraswap dapp with a light theme as parameter
                 */
                [ScreenName.MarketList]: "market",
              },
            },
            [NavigatorName.Discover]: {
              screens: {
                /**
                 * @params ?platform: string
                 * ie: "ledgerlive://discover" will open the catalog
                 * ie: "ledgerlive://discover/paraswap?theme=light" will open the catalog and the paraswap dapp with a light theme as parameter
                 */
                [ScreenName.PlatformCatalog]: "discover/:platform?",
              },
            },
            [NavigatorName.Manager]: {
              screens: {
                /**
                 * ie: "ledgerlive://manager" will open the manager
                 *
                 * @params ?installApp: string
                 * ie: "ledgerlive://manager?installApp=bitcoin" will open the manager with "bitcoin" prefilled in the search input
                 *
                 * * @params ?searchQuery: string
                 * ie: "ledgerlive://manager?searchQuery=bitcoin" will open the manager with "bitcoin" prefilled in the search input
                 */
                [ScreenName.Manager]: "manager",
              },
            },
          },
        },
        [NavigatorName.ReceiveFunds]: {
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerlive://receive?currency=bitcoin" will open the prefilled search account in the receive flow
             */
            [ScreenName.ReceiveSelectAccount]: "receive",
          },
        },
        [NavigatorName.Swap]: {
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerlive://receive?currency=bitcoin" will open the prefilled search account in the receive flow
             */
            [ScreenName.Swap]: "swap",
          },
        },
        [NavigatorName.SendFunds]: {
          screens: {
            /**
             * @params ?currency: string
             * ie: "ledgerlive://send?currency=bitcoin" will open the prefilled search account in the send flow
             */
            [ScreenName.SendCoin]: "send",
          },
        },
        [NavigatorName.ExchangeBuyFlow]: {
          screens: {
            /**
             * @params currency: string
             * ie: "ledgerlive://buy/bitcoin" -> will redirect to the prefilled search currency in the buy crypto flow
             */
            [ScreenName.ExchangeSelectCurrency]: "buy/:currency",
          },
        },
        /**
         * ie: "ledgerlive://buy" -> will redirect to the main exchange page
         */
        [NavigatorName.Exchange]: {
          initialRouteName: "buy",
          screens: {
            [ScreenName.ExchangeBuy]: "buy",
            [ScreenName.Coinify]: "buy/coinify",
          },
        },
        /**
         * ie: "ledgerlive://swap" -> will redirect to the main swap page
         */
        [NavigatorName.Swap]: "swap",
        [NavigatorName.Settings]: {
          initialRouteName: [ScreenName.SettingsScreen],
          screens: {
            /**
             * ie: "ledgerlive://settings/experimental" -> will redirect to the experimental settings panel
             */
            [ScreenName.SettingsScreen]: "settings",
            [ScreenName.GeneralSettings]: "settings/general",
            [ScreenName.AccountsSettings]: "settings/accounts",
            [ScreenName.AboutSettings]: "settings/about",
            [ScreenName.HelpSettings]: "settings/help",
            [ScreenName.ExperimentalSettings]: "settings/experimental",
            [ScreenName.DeveloperSettings]: "settings/developer",
          },
        },
      },
    },
  },
};

const DeepLinkingNavigator = ({ children }: { children: React$Node }) => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const wcContext = useContext(_wcContext);

  const linking = useMemo(
    () => ({
      ...linkingOptions,
      ...alreadyOnboardedLinkingConfigScreens,
      enabled:
        hasCompletedOnboarding &&
        wcContext.initDone &&
        !wcContext.session.session,
    }),
    [hasCompletedOnboarding, wcContext.initDone, wcContext.session.session],
  );

  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!wcContext.initDone) {
      return;
    }
    setIsReady(true);
  }, [wcContext.initDone]);

  React.useEffect(
    () => () => {
      isReadyRef.current = false;
    },
    [],
  );

  const theme = useSelector(themeSelector);
  const osTheme = useSelector(osThemeSelector);

  const compareOsTheme = useCallback(() => {
    const currentOsTheme = Appearance.getColorScheme();
    if (currentOsTheme && osTheme !== currentOsTheme) {
      dispatch(setOsTheme(currentOsTheme));
    }
  }, [dispatch, osTheme]);

  useEffect(() => {
    compareOsTheme();
    const osThemeChangeHandler = nextAppState =>
      nextAppState === "active" && compareOsTheme();
    const sub = AppState.addEventListener("change", osThemeChangeHandler);
    return () => sub.remove();
  }, [compareOsTheme]);

  const resolvedTheme = useMemo(
    () =>
      ((theme === "system" && osTheme) || theme) === "light" ? "light" : "dark",
    [theme, osTheme],
  );

  if (!isReady) {
    return null;
  }

  return (
    <StyleProvider selectedPalette={resolvedTheme}>
      <NavigationContainer
        theme={themes[resolvedTheme]}
        linking={linking}
        ref={navigationRef}
        onReady={() => {
          isReadyRef.current = true;
          setTimeout(() => SplashScreen.hide(), 300);
        }}
      >
        {children}
      </NavigationContainer>
    </StyleProvider>
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

  onInitFinished = () => {};

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
                <AdjustProvider />
                <HookAnalytics store={store} />
                <WalletConnectProvider>
                  <PlatformAppProvider
                    platformAppsServerURL={
                      getProvider(__DEV__ ? "staging" : "production").url
                    }
                  >
                    <FirebaseRemoteConfigProvider>
                      <FirebaseFeatureFlagsProvider>
                        <SafeAreaProvider>
                          <DeepLinkingNavigator>
                            <StyledStatusBar />
                            <NavBarColorHandler />
                            <AuthPass>
                              <I18nextProvider i18n={i18n}>
                                <LocaleProvider>
                                  <BridgeSyncProvider>
                                    <CounterValuesProvider
                                      initialState={initialCountervalues}
                                    >
                                      <ButtonUseTouchable.Provider value={true}>
                                        <OnboardingContextProvider>
                                          <ToastProvider>
                                            <NotificationsProvider>
                                              <SnackbarContainer />
                                              <NftMetadataProvider>
                                                <MarketDataProvider>
                                                  <App
                                                    importDataString={
                                                      importDataString
                                                    }
                                                  />
                                                </MarketDataProvider>
                                              </NftMetadataProvider>
                                            </NotificationsProvider>
                                          </ToastProvider>
                                        </OnboardingContextProvider>
                                      </ButtonUseTouchable.Provider>
                                    </CounterValuesProvider>
                                  </BridgeSyncProvider>
                                </LocaleProvider>
                              </I18nextProvider>
                            </AuthPass>
                          </DeepLinkingNavigator>
                        </SafeAreaProvider>
                      </FirebaseFeatureFlagsProvider>
                    </FirebaseRemoteConfigProvider>
                  </PlatformAppProvider>
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
