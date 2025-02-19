import { NotEnoughBalance } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { getFeature, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useAutoDismissPostOnboardingEntryPoint } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import { useCountervaluesExport } from "@ledgerhq/live-countervalues-react";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { exportWalletState, walletStateExportShouldDiffer } from "@ledgerhq/live-wallet/store";
import { log } from "@ledgerhq/logs";
import { LogLevel, PerformanceProfiler, RenderPassReport } from "@shopify/react-native-performance";
import QueuedDrawersContextProvider from "LLM/components/QueuedDrawer/QueuedDrawersContextProvider";
import isEqual from "lodash/isEqual";
import React, { Component, useCallback, useEffect, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { Appearance, AppState, LogBox, StyleSheet } from "react-native";
import Config from "react-native-config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "react-native-splash-screen";
import { useDispatch, useSelector } from "react-redux";
import { useTrackingPairs } from "~/actions/general";
import { setAnalytics, setOsTheme, setPersonalizedRecommendations } from "~/actions/settings";
import SegmentSetup from "~/analytics/SegmentSetup";
import SyncNewAccounts from "~/bridge/SyncNewAccounts";
import AnalyticsConsole from "~/components/AnalyticsConsole";
import useDBSaveEffect from "~/components/DBSave";
import DebugTheme from "~/components/DebugTheme";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { FirebaseRemoteConfigProvider } from "~/components/FirebaseRemoteConfig";
import HookSentry from "~/components/HookSentry";
import LoadingApp from "~/components/LoadingApp";
import NavBarColorHandler from "~/components/NavBarColorHandler";
import PerformanceConsole from "~/components/PerformanceConsole";
import { performanceReportSubject } from "~/components/PerformanceConsole/usePerformanceReportsLog";
import RootNavigator from "~/components/RootNavigator";
import SetEnvsFromSettings from "~/components/SetEnvsFromSettings";
import StyledStatusBar from "~/components/StyledStatusBar";
import TransactionsAlerts from "~/components/TransactionsAlerts";
import AuthPass from "~/context/AuthPass";
import LedgerStoreProvider from "~/context/LedgerStore";
import LocaleProvider, { i18n } from "~/context/Locale";
import RebootProvider from "~/context/Reboot";
import { store } from "~/context/store";
import HookDynamicContentCards from "~/dynamicContent/useContentCards";
import { useSettings } from "~/hooks";
import { useListenToHidDevices } from "~/hooks/useListenToHidDevices";
import { TermsAndConditionMigrateLegacyData } from "~/logic/terms";
import { DeeplinksProvider } from "~/navigation/DeeplinksProvider";
import HookNotifications from "~/notifications/HookNotifications";
import { exportSelector as accountsExportSelector, accountsSelector } from "~/reducers/accounts";
import { exportSelector as bleSelector } from "~/reducers/ble";
import {
  hasCompletedOnboardingSelector,
  hasSeenAnalyticsOptInPromptSelector,
  osThemeSelector,
  exportSelector as settingsExportSelector,
} from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { walletSelector } from "~/reducers/wallet";
import Modals from "~/screens/Modals";
import ExperimentalHeader from "~/screens/Settings/Experimental/ExperimentalHeader";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import LDMKTransportHeader from "~/screens/Settings/Experimental/LDMKTransportHeader";
import { init } from "../e2e/bridge/client";
import { updateIdentify } from "./analytics";
import AppProviders from "./AppProviders";
import { StorylyProvider } from "./components/StorylyStories/StorylyProvider";
import "./config/configInit";
import {
  saveAccounts,
  saveBle,
  saveCountervalues,
  saveMarketState,
  savePostOnboardingState,
  saveSettings,
  saveTrustchainState,
  saveWalletExportState,
} from "./db";
import "./iosWebsocketFix";
import "./live-common-setup";
import logger from "./logger";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";
import "./polyfill";
import { exportMarketSelector } from "./reducers/market";
import { registerTransports } from "./services/registerTransports";
import StyleProvider from "./StyleProvider";

if (Config.DISABLE_YELLOW_BOX) {
  LogBox.ignoreAllLogs();
}

if (__DEV__) {
  require("./ReactotronConfig");
}

checkLibs({
  NotEnoughBalance,
  React,
  log,
  Transport,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

function walletExportSelector(state: State) {
  return exportWalletState(walletSelector(state));
}

function App() {
  const accounts = useSelector(accountsSelector);
  const analyticsFF = useFeature("llmAnalyticsOptInPrompt");
  const isLDMKEnabled = Boolean(useFeature("ldmkTransport")?.enabled);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const dispatch = useDispatch();

  useEffect(() => registerTransports(isLDMKEnabled), [isLDMKEnabled]);

  useEffect(() => {
    if (
      !analyticsFF?.enabled ||
      (hasCompletedOnboarding && !analyticsFF?.params?.entryPoints?.includes?.("Portfolio")) ||
      hasSeenAnalyticsOptInPrompt
    )
      return;
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
  }, [
    analyticsFF?.enabled,
    analyticsFF?.params?.entryPoints,
    dispatch,
    hasSeenAnalyticsOptInPrompt,
    hasCompletedOnboarding,
  ]);

  useAccountsWithFundsListener(accounts, updateIdentify);
  useFetchCurrencyAll();
  useFetchCurrencyFrom();
  useListenToHidDevices();
  useAutoDismissPostOnboardingEntryPoint();

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

  useDBSaveEffect({
    save: saveMarketState,
    throttle: 500,
    getChangesStats: (a, b) => a.market !== b.market,
    lense: exportMarketSelector,
  });

  useDBSaveEffect({
    save: saveTrustchainState,
    throttle: 500,
    getChangesStats: (a, b) => a.trustchain !== b.trustchain,
    lense: trustchainStoreSelector,
  });

  useDBSaveEffect({
    save: saveWalletExportState,
    throttle: 500,
    getChangesStats: (a, b) => walletStateExportShouldDiffer(a.wallet, b.wallet),
    lense: walletExportSelector,
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
    if (Config.DETOX) {
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
        <LedgerStoreProvider onInitFinished={this.onInitFinished} store={store}>
          {(ready, initialCountervalues) =>
            ready ? (
              <>
                <SetEnvsFromSettings />
                <HookSentry />
                <SegmentSetup />
                <HookNotifications />
                <HookDynamicContentCards />
                <TermsAndConditionMigrateLegacyData />
                <QueuedDrawersContextProvider>
                  <FirebaseRemoteConfigProvider>
                    <FirebaseFeatureFlagsProvider getFeature={getFeature}>
                      <I18nextProvider i18n={i18n}>
                        <LocaleProvider>
                          <PlatformAppProviderWrapper>
                            <SafeAreaProvider>
                              <PerformanceProvider>
                                <StorylyProvider>
                                  <StylesProvider>
                                    <StyledStatusBar />
                                    <NavBarColorHandler />
                                    <AuthPass>
                                      <AppProviders initialCountervalues={initialCountervalues}>
                                        <App />
                                      </AppProviders>
                                    </AuthPass>
                                  </StylesProvider>
                                </StorylyProvider>
                              </PerformanceProvider>
                            </SafeAreaProvider>
                          </PlatformAppProviderWrapper>
                        </LocaleProvider>
                      </I18nextProvider>
                    </FirebaseFeatureFlagsProvider>
                  </FirebaseRemoteConfigProvider>
                </QueuedDrawersContextProvider>
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
