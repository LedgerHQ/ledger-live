import "./polyfill";
import "./live-common-setup";
import "../e2e/e2e-bridge-setup";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { Component, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, LogBox, Appearance, AppState } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import { useCountervaluesExport } from "@ledgerhq/live-common/countervalues/react";
import { pairId } from "@ledgerhq/live-common/countervalues/helpers";
import { NftMetadataProvider } from "@ledgerhq/live-common/nft/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";

import { isEqual } from "lodash";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import Config from "react-native-config";
import {
  LogLevel,
  PerformanceProfiler,
  RenderPassReport,
} from "@shopify/react-native-performance";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useDispatch, useSelector } from "react-redux";
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
import WalletConnectProvider from "./screens/WalletConnect/Provider";

import AnalyticsProvider from "./analytics/AnalyticsProvider";
import HookSentry from "./components/HookSentry";
import HookNotifications from "./notifications/HookNotifications";
import RootNavigator from "./components/RootNavigator";
import SetEnvsFromSettings from "./components/SetEnvsFromSettings";
import CounterValuesProvider from "./components/CounterValuesProvider";
import type { State } from "./reducers/types";
import { useTrackingPairs } from "./actions/general";
import ExperimentalHeader from "./screens/Settings/Experimental/ExperimentalHeader";
import Modals from "./screens/Modals";
import NotificationsProvider from "./screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "./screens/NotificationCenter/Snackbar/SnackbarContainer";
import NavBarColorHandler from "./components/NavBarColorHandler";
import { FirebaseRemoteConfigProvider } from "./components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "./components/FirebaseFeatureFlags";
import MarketDataProvider from "./screens/Market/MarketDataProviderWrapper";
import AdjustProvider from "./components/AdjustProvider";
import DelayedTrackingProvider from "./components/DelayedTrackingProvider";
import PostOnboardingProviderWrapped from "./logic/postOnboarding/PostOnboardingProviderWrapped";
import { GeneralTermsContextProvider } from "./logic/terms";
import HookDynamicContentCards from "./dynamicContent/useContentCards";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";
import PerformanceConsole from "./components/PerformanceConsole";
import { useListenToHidDevices } from "./hooks/useListenToHidDevices";
import { DeeplinksProvider } from "./navigation/DeeplinksProvider";
import StyleProvider from "./StyleProvider";
import { performanceReportSubject } from "./components/PerformanceConsole/usePerformanceReportsLog";
import { setOsTheme } from "./actions/settings";

if (Config.DISABLE_YELLOW_BOX) {
  LogBox.ignoreAllLogs();
}

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

function App() {
  useAppStateListener();
  useListenToHidDevices();

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
      <RootNavigator />
      <AnalyticsConsole />
      <PerformanceConsole />
      <DebugTheme />
      <Modals />
    </GestureHandlerRootView>
  );
}

const PerformanceProvider = ({ children }: { children: React.ReactNode }) => {
  const onReportPrepared = useCallback((report: RenderPassReport) => {
    performanceReportSubject.next({ report, date: new Date() });
  }, []);
  const performanceConsoleEnabled = useEnv("PERFORMANCE_CONSOLE");

  return (
    <PerformanceProfiler
      onReportPrepared={onReportPrepared}
      logLevel={LogLevel.Info}
      enabled={!!performanceConsoleEnabled}
    >
      {children}
    </PerformanceProfiler>
  );
};

const StylesProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useSelector(themeSelector);
  const osTheme = useSelector(osThemeSelector);
  const dispatch = useDispatch();

  const compareOsTheme = useCallback(() => {
    const currentOsTheme = Appearance.getColorScheme();

    if (currentOsTheme && osTheme !== currentOsTheme) {
      dispatch(setOsTheme(currentOsTheme));
    }
  }, [dispatch, osTheme]);

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

  return (
    <StyleProvider selectedPalette={resolvedTheme}>
      <GeneralTermsContextProvider>
        <DeeplinksProvider resolvedTheme={resolvedTheme}>
          {children}
        </DeeplinksProvider>
      </GeneralTermsContextProvider>
    </StyleProvider>
  );
};

export default class Root extends Component {
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
                            <PerformanceProvider>
                              <StylesProvider>
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
                                                        <App />
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
                              </StylesProvider>
                            </PerformanceProvider>
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
