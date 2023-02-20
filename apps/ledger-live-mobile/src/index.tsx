import "./polyfill";
import "./live-common-setup";
import "../e2e/e2e-bridge-setup";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, {
  Component,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Sentry from "@sentry/react-native";
import {
  StyleSheet,
  Linking,
  Appearance,
  AppState,
  Platform,
  LogBox,
} from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import {
  getStateFromPath,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { useFlipper } from "@react-navigation/devtools";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import { useCountervaluesExport } from "@ledgerhq/live-common/countervalues/react";
import { pairId } from "@ledgerhq/live-common/countervalues/helpers";
import { NftMetadataProvider } from "@ledgerhq/live-common/nft/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

import { isEqual } from "lodash";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import Braze from "react-native-appboy-sdk";
import Config from "react-native-config";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import {
  LogLevel,
  PerformanceProfiler,
  RenderPassReport,
} from "@shopify/react-native-performance";
import logger from "./logger";
import {
  saveAccounts,
  saveBle,
  saveSettings,
  saveCountervalues,
  savePostOnboardingState,
} from "./db";
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
import DebugTheme from "./components/DebugTheme";
import { BridgeSyncProvider } from "./bridge/BridgeSyncContext";
import useDBSaveEffect from "./components/DBSave";
import useAppStateListener from "./components/useAppStateListener";
import SyncNewAccounts from "./bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "./screens/Onboarding/onboardingContext";
import WalletConnectProvider, {
  context as _wcContext,
} from "./screens/WalletConnect/Provider";

import AnalyticsProvider from "./analytics/AnalyticsProvider";
import HookSentry from "./components/HookSentry";
import HookNotifications from "./notifications/HookNotifications";
import RootNavigator from "./components/RootNavigator";
import SetEnvsFromSettings from "./components/SetEnvsFromSettings";
import CounterValuesProvider from "./components/CounterValuesProvider";
import type { State } from "./reducers/types";
import { navigationRef, isReadyRef } from "./rootnavigation";
import { useTrackingPairs } from "./actions/general";
import { ScreenName, NavigatorName } from "./const";
import ExperimentalHeader from "./screens/Settings/Experimental/ExperimentalHeader";
import Modals from "./screens/Modals";
import { lightTheme, darkTheme, Theme } from "./colors";
import NotificationsProvider from "./screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "./screens/NotificationCenter/Snackbar/SnackbarContainer";
import NavBarColorHandler from "./components/NavBarColorHandler";
import { setOsTheme } from "./actions/settings";
import { FirebaseRemoteConfigProvider } from "./components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "./components/FirebaseFeatureFlags";
import StyleProvider from "./StyleProvider";
import MarketDataProvider from "./screens/Market/MarketDataProviderWrapper";
import AdjustProvider from "./components/AdjustProvider";
import DelayedTrackingProvider from "./components/DelayedTrackingProvider";
import { setWallectConnectUri } from "./actions/walletconnect";
import PostOnboardingProviderWrapped from "./logic/postOnboarding/PostOnboardingProviderWrapped";
import { isAcceptedTerms } from "./logic/terms";
import type { Writeable } from "./types/helpers";
import HookDynamicContentCards from "./dynamicContent/useContentCards";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";
import { performanceReportSubject } from "./components/PerformanceConsole/usePerformanceReportsLog";
import PerformanceConsole from "./components/PerformanceConsole";
import useEnv from "../../../libs/ledger-live-common/lib/hooks/useEnv";

if (Config.DISABLE_YELLOW_BOX) {
  LogBox.ignoreAllLogs();
}

const themes: {
  [key: string]: Theme;
} = {
  light: lightTheme,
  dark: darkTheme,
};
checkLibs({
  NotEnoughBalance,
  React,
  log,
  Transport,
});
// useScreens();
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

type AppProps = {
  importDataString?: string;
};

export const routingInstrumentation =
  new Sentry.ReactNavigationInstrumentation();

function App({ importDataString }: AppProps) {
  useAppStateListener();
  const getSettingsChanged = useCallback(
    (a, b) => a.settings !== b.settings,
    [],
  );
  const getAccountsChanged = useCallback(
    (
      oldState: State,
      newState: State,
    ):
      | {
          changed: string[];
        }
      | null
      | undefined => {
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
    },
    [],
  );

  const getPostOnboardingStateChanged = useCallback(
    (a, b) => !isEqual(a.postOnboarding, b.postOnboarding),
    [],
  );

  const rawState = useCountervaluesExport();
  const trackingPairs = useTrackingPairs();
  const pairIds = useMemo(
    () => trackingPairs.map(p => pairId(p)),
    [trackingPairs],
  );
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
  useDBSaveEffect({
    save: savePostOnboardingState,
    throttle: 500,
    getChangesStats: getPostOnboardingStateChanged,
    lense: postOnboardingSelector,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SyncNewAccounts priority={5} />
      <ExperimentalHeader />
      <RootNavigator importDataString={importDataString} />
      <AnalyticsConsole />
      <PerformanceConsole />
      <DebugTheme />
      <Modals />
    </GestureHandlerRootView>
  );
}

function isWalletConnectUrl(url: string) {
  return url.substring(0, 3) === "wc:";
}

function isWalletConnectLink(url: string) {
  return (
    isWalletConnectUrl(url) ||
    url.substring(0, 20) === "ledgerlive://wc" ||
    url.substring(0, 26) === "https://ledger.com/wc"
  );
}

// https://docs.walletconnect.com/mobile-linking#wallet-support
function isValidWalletConnectUrl(_url: string) {
  let url = _url;
  if (!isWalletConnectUrl(url)) {
    const uri = new URL(url).searchParams.get("uri");
    if (!uri) {
      return false;
    }
    url = uri;
  }
  const { protocol, search } = new URL(url);
  return protocol === "wc:" && search;
}

function isInvalidWalletConnectLink(url: string) {
  if (!isWalletConnectLink(url) || isValidWalletConnectUrl(url)) {
    return false;
  }
  return true;
}

function getProxyURL(url: string) {
  if (isWalletConnectUrl(url)) {
    return `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }

  return url;
}

// DeepLinking
const linkingOptions = {
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      return url && !isInvalidWalletConnectLink(url) ? getProxyURL(url) : null;
    }
    const brazeUrl: string = await new Promise(resolve => {
      Braze.getInitialURL(initialUrl => {
        resolve(initialUrl);
      });
    });
    return brazeUrl && !isInvalidWalletConnectLink(brazeUrl)
      ? getProxyURL(brazeUrl)
      : null;
  },

  prefixes: ["ledgerlive://", "https://ledger.com"],
  config: {
    screens: {
      [NavigatorName.Base]: {
        initialRouteName: NavigatorName.Main,
        screens: {
          [NavigatorName.WalletConnect]: {
            screens: {
              /**
               * @params ?uri: string
               * ie: "ledgerlive://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae
               */
              [ScreenName.WalletConnectDeeplinkingSelectAccount]: "wc",
            },
          },

          [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",

          [ScreenName.BleDevicePairingFlow]: "sync-onboarding",

          [NavigatorName.PostOnboarding]: {
            screens: {
              /**
               * @params ?completed: boolean
               * ie: "ledgerlive://post-onboarding/nft-claimed?completed=true" will open the post onboarding hub and complete the Nft claim action
               */
              [ScreenName.PostOnboardingHub]: "post-onboarding/nft-claimed",
            },
          },

          [NavigatorName.ClaimNft]: {
            screens: {
              /**
               * ie: "ledgerlive://linkdrop-nft-claim/qr-scanning" will redirect to the QR scanning page
               */
              [ScreenName.ClaimNftQrScan]: "linkdrop-nft-claim/qr-scanning",
            },
          },

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
                   * ie: "ledgerlive://myledger" will open MyLedger page
                   *
                   * @params ?installApp: string
                   * ie: "ledgerlive://myledger?installApp=bitcoin" will open myledger with "bitcoin" prefilled in the search input
                   *
                   * * @params ?searchQuery: string
                   * ie: "ledgerlive://myledger?searchQuery=bitcoin" will open myledger with "bitcoin" prefilled in the search input
                   */
                  [ScreenName.Manager]: "myledger",
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
              [ScreenName.ReceiveSelectCrypto]: "receive",
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

          [NavigatorName.Accounts]: {
            screens: {
              /**
               * @params ?id: string
               * ie: "ledgerlive://accounts?currency=ethereum&address={{eth_account_address}}"
               */
              [ScreenName.Accounts]: "accounts",
            },
          },

          [NavigatorName.AddAccounts]: {
            screens: {
              /**
               * ie: "ledgerlive://add-account" will open the add account flow
               *
               * @params ?currency: string
               * ie: "ledgerlive://add-account?currency=bitcoin" will open the add account flow with "bitcoin" prefilled in the search input
               *
               */
              [ScreenName.AddAccountsSelectCrypto]: "add-account",
            },
          },

          /**
           * ie: "ledgerlive://buy" -> will redirect to the main exchange page
           */
          [NavigatorName.Exchange]: {
            initialRouteName: "buy",
            screens: {
              [ScreenName.ExchangeBuy]: "buy/:currency?",
              [ScreenName.ExchangeSell]: "sell/:currency?",
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

          [NavigatorName.CustomImage]: {
            screens: {
              /**
               * ie: "ledgerlive://custom-image"
               */
              [ScreenName.CustomImageStep0Welcome]: "custom-image",
            },
          },
        },
      },
    },
  },
};

const getOnboardingLinkingOptions = (acceptedTermsOfUse: boolean) => ({
  ...linkingOptions,
  config: {
    screens: !acceptedTermsOfUse
      ? {}
      : {
          [NavigatorName.Base]: {
            initialRouteName: NavigatorName.Main,
            screens: {
              [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",
              [ScreenName.BleDevicePairingFlow]: "sync-onboarding",
            },
          },
        },
  },
});

const emptyObject: LiveAppManifest[] = [];

const DeepLinkingNavigator = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const performanceConsoleEnabled = useEnv("PERFORMANCE_CONSOLE");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const wcContext = useContext(_wcContext);
  const { state } = useRemoteLiveAppContext();
  const liveAppProviderInitialized = !!state.value || !!state.error;
  const manifests = state?.value?.liveAppByIndex || emptyObject;
  // Can be either true, false or null, meaning we don't know yet
  const [userAcceptedTerms, setUserAcceptedTerms] = useState<boolean | null>(
    null,
  );

  const linking = useMemo<LinkingOptions<ReactNavigation.RootParamList>>(
    () =>
      ({
        ...(hasCompletedOnboarding
          ? linkingOptions
          : getOnboardingLinkingOptions(!!userAcceptedTerms)),
        enabled: wcContext.initDone && !wcContext.session.session,
        subscribe(listener) {
          const sub = Linking.addEventListener("url", ({ url }) => {
            // Prevent default deeplink if invalid wallet connect link
            if (isInvalidWalletConnectLink(url)) {
              return;
            }

            // Prevent default deeplink if we're already in a wallet connect route.
            const route = navigationRef.current?.getCurrentRoute();
            if (
              isWalletConnectLink(url) &&
              route &&
              [
                ScreenName.WalletConnectScan,
                ScreenName.WalletConnectDeeplinkingSelectAccount,
                ScreenName.WalletConnectConnect,
              ].includes(route.name as ScreenName)
            ) {
              const uri = isWalletConnectUrl(url)
                ? url
                : // we know uri exists in the searchParams because we check it in isValidWalletConnectUrl
                  new URL(url).searchParams.get("uri")!;
              dispatch(setWallectConnectUri(uri));
              return;
            }

            listener(getProxyURL(url));
          });
          // Clean up the event listeners
          return () => {
            sub.remove();
          };
        },
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

            const manifest = manifests.find(
              m => m.id.toLowerCase() === platform.toLowerCase(),
            );
            if (!manifest) return undefined;
            url.pathname = `/${manifest.id}`;
            url.searchParams.set("name", manifest.name);
            return getStateFromPath(url.href?.split("://")[1], config);
          }

          return getStateFromPath(path, config);
        },
      } as LinkingOptions<ReactNavigation.RootParamList>),
    [
      hasCompletedOnboarding,
      wcContext.initDone,
      wcContext.session.session,
      dispatch,
      liveAppProviderInitialized,
      manifests,
      userAcceptedTerms,
    ],
  );
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!wcContext.initDone) return;
    if (userAcceptedTerms === null) return;
    setIsReady(true);
  }, [wcContext.initDone, userAcceptedTerms]);

  React.useEffect(
    () => () => {
      (isReadyRef as Writeable<typeof isReadyRef>).current = false;
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
    const loadTerms = async () => setUserAcceptedTerms(await isAcceptedTerms());
    loadTerms();
  }, []);

  useEffect(() => {
    compareOsTheme();

    const osThemeChangeHandler = (nextAppState: string) =>
      nextAppState === "active" && compareOsTheme();

    const sub = AppState.addEventListener("change", osThemeChangeHandler);
    return () => sub.remove();
  }, [compareOsTheme]);
  const resolvedTheme = useMemo(
    () =>
      ((theme === "system" && osTheme) || theme) === "light" ? "light" : "dark",
    [theme, osTheme],
  );

  useFlipper(navigationRef);

  const onReportPrepared = useCallback((report: RenderPassReport) => {
    performanceReportSubject.next({ report, date: new Date() });
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <StyleProvider selectedPalette={resolvedTheme}>
      <PerformanceProfiler
        onReportPrepared={onReportPrepared}
        logLevel={LogLevel.Info}
        enabled={!!performanceConsoleEnabled}
      >
        <NavigationContainer
          theme={themes[resolvedTheme]}
          linking={linking}
          ref={navigationRef}
          onReady={() => {
            (isReadyRef as Writeable<typeof isReadyRef>).current = true;
            setTimeout(() => SplashScreen.hide(), 300);
            routingInstrumentation.registerNavigationContainer(navigationRef);
          }}
        >
          {children}
        </NavigationContainer>
      </PerformanceProfiler>
    </StyleProvider>
  );
};

export default class Root extends Component<{
  importDataString?: string;
}> {
  initTimeout: ReturnType<typeof setTimeout> | undefined;

  componentWillUnmount() {
    clearTimeout(this.initTimeout);
  }

  componentDidCatch(e: Error) {
    logger.critical(e);
    throw e;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
                <DelayedTrackingProvider />
                <AnalyticsProvider store={store}>
                  <HookNotifications />
                  <HookDynamicContentCards />
                  <WalletConnectProvider>
                    <PlatformAppProviderWrapper>
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
                                            <PostOnboardingProviderWrapped>
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
                                            </PostOnboardingProviderWrapped>
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
                    </PlatformAppProviderWrapper>
                  </WalletConnectProvider>
                </AnalyticsProvider>
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
