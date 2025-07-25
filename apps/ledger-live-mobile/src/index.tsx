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
  saveLargeMoverState,
} from "./db";
import {
  exportSelector as settingsExportSelector,
  osThemeSelector,
  hasSeenAnalyticsOptInPromptSelector,
  hasCompletedOnboardingSelector,
  trackingEnabledSelector,
  reportErrorsEnabledSelector,
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
import { FeatureToggle, getFeature, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StorylyProvider } from "./components/StorylyStories/StorylyProvider";
import { useSettings } from "~/hooks";
import AppProviders from "./AppProviders";
import { useAutoDismissPostOnboardingEntryPoint } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import QueuedDrawersContextProvider from "LLM/components/QueuedDrawer/QueuedDrawersContextProvider";
import { exportMarketSelector } from "./reducers/market";
import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { walletSelector } from "~/reducers/wallet";
import { exportWalletState, walletStateExportShouldDiffer } from "@ledgerhq/live-wallet/store";
import { registerTransports } from "~/services/registerTransports";
import { useDeviceManagementKitEnabled } from "@ledgerhq/live-dmk-mobile";
import { StoragePerformanceOverlay } from "./newArch/storage/screens/PerformanceMonitor";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import AppVersionBlocker from "LLM/features/AppBlockers/components/AppVersionBlocker";
import AppGeoBlocker from "LLM/features/AppBlockers/components/AppGeoBlocker";
import { exportLargeMoverSelector } from "./reducers/largeMover";
import {
  TrackingConsent,
  DatadogProvider,
  AutoInstrumentationConfiguration,
  DdSdkReactNative,
  PropagatorType,
} from "@datadog/mobile-react-native";
import { PartialInitializationConfiguration } from "@datadog/mobile-react-native/lib/typescript/DdSdkReactNativeConfiguration";
import { customErrorEventMapper, initializeDatadogProvider } from "./datadog";
import { initSentry } from "./sentry";
import getOrCreateUser from "./user";
import { FIRST_PARTY_MAIN_HOST_DOMAIN } from "./utils/constants";

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
  const datadogFF = useFeature("llmDatadog");
  const sentryFF = useFeature("llmSentry");
  const isLDMKEnabled = useDeviceManagementKitEnabled();
  const providerNumber = useEnv("FORCE_PROVIDER");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const dmk = useDeviceManagementKit();
  const dispatch = useDispatch();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const automaticBugReportingEnabled = useSelector(reportErrorsEnabledSelector);

  const datadogAutoInstrumentation: AutoInstrumentationConfiguration = useMemo(
    () => ({
      trackErrors: datadogFF?.params?.trackErrors ?? false,
      trackInteractions: datadogFF?.params?.trackInteractions ?? false,
      trackResources: datadogFF?.params?.trackResources ?? false,
      errorEventMapper: customErrorEventMapper(!automaticBugReportingEnabled),
      firstPartyHosts: [
        {
          match: FIRST_PARTY_MAIN_HOST_DOMAIN,
          propagatorTypes: [PropagatorType.DATADOG, PropagatorType.TRACECONTEXT],
        },
      ],
    }),
    [datadogFF?.params, automaticBugReportingEnabled],
  );

  useEffect(() => {
    if (providerNumber && isLDMKEnabled) {
      dmk?.setProvider(providerNumber);
    }
    // setting provider only at initialisation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLDMKEnabled, dmk]);

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

  useEffect(() => {
    if (!datadogFF?.enabled) return;
    const setUserEquipmentId = async () => {
      const { user } = await getOrCreateUser();
      if (!user) return;
      const { id } = user; // id is the user uuid aka equipment ID (used
      // in segment)
      DdSdkReactNative.setUserInfo({
        id,
      });
    };
    initializeDatadogProvider(
      datadogFF?.params as Partial<PartialInitializationConfiguration>,
      isTrackingEnabled ? TrackingConsent.GRANTED : TrackingConsent.NOT_GRANTED,
    )
      .then(setUserEquipmentId)
      .catch(e => {
        console.error("Datadog initialization failed", e);
      });
  }, [datadogFF?.params, datadogFF?.enabled, isTrackingEnabled]);

  useEffect(() => {
    if (sentryFF?.enabled) {
      initSentry(automaticBugReportingEnabled);
    }
  }, [sentryFF?.enabled, automaticBugReportingEnabled]);

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

  useDBSaveEffect({
    save: saveLargeMoverState,
    throttle: 500,
    getChangesStats: (a, b) => a.largeMover !== b.largeMover,
    lense: exportLargeMoverSelector,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SyncNewAccounts priority={5} />
      <TransactionsAlerts />
      <ExperimentalHeader />
      {datadogFF?.enabled ? (
        <DatadogProvider configuration={datadogAutoInstrumentation}>
          <RootNavigator />
        </DatadogProvider>
      ) : (
        <RootNavigator />
      )}

      <AnalyticsConsole />
      <PerformanceConsole />
      <DebugTheme />
      <Modals />
      <FeatureToggle featureId="llmMmkvMigration">
        <StoragePerformanceOverlay />
      </FeatureToggle>
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
                {/* TODO: delete the following HookSentry when Sentry will be completelyy switched off */}
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
                                        <AppGeoBlocker>
                                          <AppVersionBlocker>
                                            <App />
                                          </AppVersionBlocker>
                                        </AppGeoBlocker>
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
