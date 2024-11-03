import "./polyfill";
import "./live-common-setup";
import "./iosWebsocketFix";
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
import { useCountervaluesExport } from "@ledgerhq/live-countervalues-react";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import "./config/configInit";
import isEqual from "lodash/isEqual";
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
  saveMarketState,
  saveTrustchainState,
  saveWalletExportState,
} from "./db";
import {
  exportSelector as settingsExportSelector,
  osThemeSelector,
  hasSeenAnalyticsOptInPromptSelector,
  hasCompletedOnboardingSelector,
} from "~/reducers/settings";
import { accountsSelector, exportSelector as accountsExportSelector } from "~/reducers/accounts";
import { exportSelector as bleSelector } from "~/reducers/ble";
import LocaleProvider, { i18n } from "~/context/Locale";
import RebootProvider from "~/context/Reboot";
import AuthPass from "~/context/AuthPass";
import LedgerStoreProvider from "~/context/LedgerStore";
import { store } from "~/context/store";
import LoadingApp from "~/components/LoadingApp";
import StyledStatusBar from "~/components/StyledStatusBar";
import AnalyticsConsole from "~/components/AnalyticsConsole";
import DebugTheme from "~/components/DebugTheme";
import useDBSaveEffect from "~/components/DBSave";
import useAppStateListener from "~/components/useAppStateListener";
import SyncNewAccounts from "~/bridge/SyncNewAccounts";

import SegmentSetup from "~/analytics/SegmentSetup";
import HookSentry from "~/components/HookSentry";
import HookNotifications from "~/notifications/HookNotifications";
import RootNavigator from "~/components/RootNavigator";
import SetEnvsFromSettings from "~/components/SetEnvsFromSettings";
import type { State } from "~/reducers/types";
import { useTrackingPairs } from "~/actions/general";
import ExperimentalHeader from "~/screens/Settings/Experimental/ExperimentalHeader";
import Modals from "~/screens/Modals";
import NavBarColorHandler from "~/components/NavBarColorHandler";
import { FirebaseRemoteConfigProvider } from "~/components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { TermsAndConditionMigrateLegacyData } from "~/logic/terms";
import HookDynamicContentCards from "~/dynamicContent/useContentCards";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";
import PerformanceConsole from "~/components/PerformanceConsole";
import { useListenToHidDevices } from "~/hooks/useListenToHidDevices";
import { DeeplinksProvider } from "~/navigation/DeeplinksProvider";
import StyleProvider from "./StyleProvider";
import { performanceReportSubject } from "~/components/PerformanceConsole/usePerformanceReportsLog";
import { setAnalytics, setOsTheme, setPersonalizedRecommendations } from "~/actions/settings";
import TransactionsAlerts from "~/components/TransactionsAlerts";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { updateIdentify } from "./analytics";
import { getFeature, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StorylyProvider } from "./components/StorylyStories/StorylyProvider";
import { useSettings } from "~/hooks";
import AppProviders from "./AppProviders";
import { useAutoDismissPostOnboardingEntryPoint } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import QueuedDrawersContextProvider from "LLM/components/QueuedDrawer/QueuedDrawersContextProvider";
import { exportMarketSelector } from "./reducers/market";
import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { walletSelector } from "~/reducers/wallet";
import { exportWalletState, walletStateExportShouldDiffer } from "@ledgerhq/live-wallet/store";
import { useSyncNFTsWithAccounts } from "./hooks/nfts/useSyncNFTsWithAccounts";

if (Config.DISABLE_YELLOW_BOX) {
  LogBox.ignoreAllLogs();
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
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const dispatch = useDispatch();

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
  useAppStateListener();
  useFetchCurrencyAll();
  useFetchCurrencyFrom();
  useListenToHidDevices();
  useAutoDismissPostOnboardingEntryPoint();

  useSyncNFTsWithAccounts();

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
                  <I18nextProvider i18n={i18n}>
                    <LocaleProvider>
                      <PlatformAppProviderWrapper>
                        <FirebaseRemoteConfigProvider>
                          <FirebaseFeatureFlagsProvider getFeature={getFeature}>
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
                          </FirebaseFeatureFlagsProvider>
                        </FirebaseRemoteConfigProvider>
                      </PlatformAppProviderWrapper>
                    </LocaleProvider>
                  </I18nextProvider>
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
