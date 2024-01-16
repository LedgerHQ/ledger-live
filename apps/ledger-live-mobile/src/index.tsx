import "./polyfill";
import "./live-common-setup";
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
import { useCountervaluesExport } from "@ledgerhq/live-countervalues/react";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { NftMetadataProvider } from "@ledgerhq/live-common/nft/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";

import { isEqual } from "lodash";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import Config from "react-native-config";
import { LogLevel, PerformanceProfiler, RenderPassReport } from "@shopify/react-native-performance";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useDispatch, useSelector } from "react-redux";
import { init } from "../e2e/bridge/client";
import logger from "./logger";
import {
  saveAccounts,
  saveBle,
  saveSettings,
  saveCountervalues,
  savePostOnboardingState,
} from "./db";
import { exportSelector as settingsExportSelector, osThemeSelector } from "~/reducers/settings";
import { accountsSelector, exportSelector as accountsExportSelector } from "~/reducers/accounts";
import { exportSelector as bleSelector } from "~/reducers/ble";
import LocaleProvider, { i18n } from "~/context/Locale";
import RebootProvider from "~/context/Reboot";
import ButtonUseTouchableContext from "~/context/ButtonUseTouchableContext";
import AuthPass from "~/context/AuthPass";
import LedgerStoreProvider from "~/context/LedgerStore";
import LoadingApp from "~/components/LoadingApp";
import StyledStatusBar from "~/components/StyledStatusBar";
import AnalyticsConsole from "~/components/AnalyticsConsole";
import DebugTheme from "~/components/DebugTheme";
import { BridgeSyncProvider } from "~/bridge/BridgeSyncContext";
import useDBSaveEffect from "~/components/DBSave";
import useAppStateListener from "~/components/useAppStateListener";
import SyncNewAccounts from "~/bridge/SyncNewAccounts";
import { OnboardingContextProvider } from "~/screens/Onboarding/onboardingContext";

import SegmentSetup from "~/analytics/SegmentSetup";
import HookSentry from "~/components/HookSentry";
import HookNotifications from "~/notifications/HookNotifications";
import RootNavigator from "~/components/RootNavigator";
import SetEnvsFromSettings from "~/components/SetEnvsFromSettings";
import CounterValuesProvider from "~/components/CounterValuesProvider";
import type { State } from "~/reducers/types";
import { useTrackingPairs } from "~/actions/general";
import ExperimentalHeader from "~/screens/Settings/Experimental/ExperimentalHeader";
import Modals from "~/screens/Modals";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";
import NavBarColorHandler from "~/components/NavBarColorHandler";
import { FirebaseRemoteConfigProvider } from "~/components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import MarketDataProvider from "~/screens/Market/MarketDataProviderWrapper";
import AdjustSetup from "~/components/AdjustSetup";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import { TermsAndConditionMigrateLegacyData } from "~/logic/terms";
import HookDynamicContentCards from "~/dynamicContent/useContentCards";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";
import PerformanceConsole from "~/components/PerformanceConsole";
import { useListenToHidDevices } from "~/hooks/useListenToHidDevices";
import { DeeplinksProvider } from "~/navigation/DeeplinksProvider";
import StyleProvider from "./StyleProvider";
import { performanceReportSubject } from "~/components/PerformanceConsole/usePerformanceReportsLog";
import { setOsTheme } from "~/actions/settings";
import TransactionsAlerts from "~/components/TransactionsAlerts";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { updateIdentify } from "./analytics";
import { LiveConfig } from "@ledgerhq/live-config/featureFlags/index";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import { StorylyProvider } from "./components/StorylyStories/StorylyProvider";
import { useSettings } from "~/hooks";

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

LiveConfig.init({
  appVersion: VersionNumber.appVersion,
  platform: Platform.OS,
  environment: process.env.NODE_ENV ?? "development",
});

function App() {
  const accounts = useSelector(accountsSelector);

  useAccountsWithFundsListener(accounts, updateIdentify);
  useAppStateListener();
  useFetchCurrencyAll();
  useFetchCurrencyFrom();
  useListenToHidDevices();

  const getSettingsChanged = useCallback((a: State, b: State) => a.settings !== b.settings, []);
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
    (a: State, b: State) => !isEqual(a.postOnboarding, b.postOnboarding),
    [],
  );

  const rawState = useCountervaluesExport();
  const trackingPairs = useTrackingPairs();
  const pairIds = useMemo(() => trackingPairs.map(p => pairId(p)), [trackingPairs]);
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
      <TransactionsAlerts />
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
  const { theme } = useSettings();
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
    () => (((theme === "system" && osTheme) || theme) === "light" ? "light" : "dark"),
    [theme, osTheme],
  );

  return (
    <StyleProvider selectedPalette={resolvedTheme}>
      <DeeplinksProvider resolvedTheme={resolvedTheme}>{children}</DeeplinksProvider>
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

  onInitFinished = () => {
    if (Config.MOCK) {
      init();
    }
  };

  onRebootStart = () => {
    clearTimeout(this.initTimeout);
    if (SplashScreen.show) SplashScreen.show(); // on iOS it seems to not be exposed
  };

  render() {
    return (
      <RebootProvider onRebootStart={this.onRebootStart}>
        <LedgerStoreProvider onInitFinished={this.onInitFinished}>
          {(ready, initialCountervalues) =>
            ready ? (
              <>
                <SetEnvsFromSettings />
                <HookSentry />
                <AdjustSetup />
                <SegmentSetup />
                <HookNotifications />
                <HookDynamicContentCards />
                <TermsAndConditionMigrateLegacyData />
                <PlatformAppProviderWrapper>
                  <FirebaseRemoteConfigProvider>
                    <FirebaseFeatureFlagsProvider>
                      <SafeAreaProvider>
                        <PerformanceProvider>
                          <StorylyProvider>
                            <StylesProvider>
                              <StyledStatusBar />
                              <NavBarColorHandler />
                              <I18nextProvider i18n={i18n}>
                                <LocaleProvider>
                                  <AuthPass>
                                    <BridgeSyncProvider>
                                      <CounterValuesProvider initialState={initialCountervalues}>
                                        <ButtonUseTouchableContext.Provider value={true}>
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
                                        </ButtonUseTouchableContext.Provider>
                                      </CounterValuesProvider>
                                    </BridgeSyncProvider>
                                  </AuthPass>
                                </LocaleProvider>
                              </I18nextProvider>
                            </StylesProvider>
                          </StorylyProvider>
                        </PerformanceProvider>
                      </SafeAreaProvider>
                    </FirebaseFeatureFlagsProvider>
                  </FirebaseRemoteConfigProvider>
                </PlatformAppProviderWrapper>
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
