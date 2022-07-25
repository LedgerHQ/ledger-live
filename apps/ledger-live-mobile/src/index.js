/* eslint-disable import/no-unresolved */
// @flow
import "./polyfill";
import "./live-common-setup";
import "../e2e/e2e-bridge-setup";
// $FlowFixMe
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  Text,
  Linking,
  Appearance,
  AppState,
  Platform,
} from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import {
  getStateFromPath,
  NavigationContainer,
} from "@react-navigation/native";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { useCountervaluesExport } from "@ledgerhq/live-common/countervalues/react";
import { pairId } from "@ledgerhq/live-common/countervalues/helpers";
import { NftMetadataProvider } from "@ledgerhq/live-common/nft/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { GlobalCatalogProvider } from "@ledgerhq/live-common/platform/providers/GlobalCatalogProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import {
  RemoteLiveAppProvider,
  useRemoteLiveAppContext,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";

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
/* eslint-disable import/named */
import WalletConnectProvider, {
  // $FlowFixMe
  context as _wcContext,
} from "./screens/WalletConnect/Provider";
/* eslint-enable import/named */
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
import RatingsModal from "./screens/RatingsModal";
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
import DelayedTrackingProvider from "./components/DelayedTrackingProvider";
import { useFilteredManifests } from "./screens/Platform/shared";

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
    <GestureHandlerRootView style={styles.root}>
      <SyncNewAccounts priority={5} />
      <ExperimentalHeader />

      <RootNavigator importDataString={importDataString} />

      <AnalyticsConsole />
      <ThemeDebug />
      <FeatureToggle feature="ratings">
        <RatingsModal />
      </FeatureToggle>
    </GestureHandlerRootView>
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
  prefixes: ["ledgerlive://", "https://ledger.com"],
  config: {
    screens: {
      [NavigatorName.Base]: {
        initialRouteName: NavigatorName.Main,
        screens: {
          /**
           * @params ?uri: string
           * ie: "ledgerlive://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae
           */
          [ScreenName.WalletConnectDeeplinkingSelectAccount]: "wc",
          [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",
          /**
           * @params ?platform: string
           * ie: "ledgerlive://discover/paraswap?theme=light" will open the catalog and the paraswap dapp with a light theme as parameter
           */
          [ScreenName.PlatformApp]: "discover/:platform",
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
                   * ie: "ledgerlive://market" will open the market screen
                   */
                  [ScreenName.MarketList]: "market",
                },
              },
              [NavigatorName.Discover]: {
                screens:
                  Platform.OS === "ios"
                    ? {}
                    : {
                        /**
                         * ie: "ledgerlive://discover" will open the catalog
                         */
                        [ScreenName.PlatformCatalog]: "discover",
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
          /**
           * ie: "ledgerlive://buy" -> will redirect to the main exchange page
           */
          [NavigatorName.Exchange]: {
            initialRouteName: "buy",
            screens: {
              [ScreenName.ExchangeBuy]: "buy/:currency?",
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
  },
};

const linkingOptionsOnboarding = {
  ...linkingOptions,
  config: {
    screens: {
      [NavigatorName.Base]: {
        initialRouteName: NavigatorName.Main,
        screens: {
          [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",
        },
      },
    },
  },
};

const platformManifestFilterParams = {
  private: true,
  branches: undefined, // will override & having it to undefined makes all branches valid
};

const DeepLinkingNavigator = ({ children }: { children: React$Node }) => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const wcContext = useContext(_wcContext);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const liveAppProviderInitialized =
    !!remoteLiveAppState.value || !!remoteLiveAppState.error;
  const filteredManifests = useFilteredManifests(platformManifestFilterParams);

  const linking = useMemo(
    () => ({
      ...(hasCompletedOnboarding ? linkingOptions : linkingOptionsOnboarding),
      enabled: wcContext.initDone && !wcContext.session.session,
      getStateFromPath: (path, config) => {
        const url = new URL(`ledgerlive://${path}`);
        const { hostname, pathname } = url;
        const platform = pathname.split("/")[1];
        if (hostname === "discover" && platform) {
          /**
           * Upstream validation of "ledgerlive://discover/:platform":
           *  - checking that a manifest exists
           *  - adding "name" search param
           * */
          if (!liveAppProviderInitialized) {
            /**
             * The provider isn't initialized yet so the manifest will possibly
             * not be found.
             * We redirect because this scenario happens when deep linking
             * triggers a cold app start. The platform app screen will show an
             * error in case the app isn't found.
             */
            return getStateFromPath(path, config);
          }
          const manifest = filteredManifests.find(
            m => m.id.toLowerCase() === platform.toLowerCase(),
          );
          if (!manifest) return undefined;
          url.pathname = `/${manifest.id}`;
          url.searchParams.set("name", manifest.name);
          return getStateFromPath(url.href?.split("://")[1], config);
        }
        return getStateFromPath(path, config);
      },
    }),
    [
      hasCompletedOnboarding,
      wcContext.initDone,
      wcContext.session.session,
      filteredManifests,
      liveAppProviderInitialized,
    ],
  );

  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!wcContext.initDone) return;
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

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

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

    const provider = __DEV__ ? "staging" : "production";

    return (
      <RebootProvider onRebootStart={this.onRebootStart}>
        <LedgerStoreProvider onInitFinished={this.onInitFinished}>
          {(ready, store, initialCountervalues) =>
            ready ? (
              <>
                <SetEnvsFromSettings />
                <HookSentry />
                <AdjustProvider />
                <DelayedTrackingProvider />
                <HookAnalytics store={store} />
                <WalletConnectProvider>
                  <RemoteLiveAppProvider
                    provider={provider}
                    updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
                  >
                    <LocalLiveAppProvider>
                      <GlobalCatalogProvider
                        provider={provider}
                        updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
                      >
                        <RampCatalogProvider
                          provider={provider}
                          updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
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
                                            <ButtonUseTouchable.Provider
                                              value={true}
                                            >
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
                        </RampCatalogProvider>
                      </GlobalCatalogProvider>
                    </LocalLiveAppProvider>
                  </RemoteLiveAppProvider>
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
