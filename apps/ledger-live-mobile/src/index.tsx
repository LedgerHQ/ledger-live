import "./polyfill";
import "./live-common-setup";
import "./iosWebsocketFix";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { Component, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, LogBox, Appearance, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import "./config/configInit";
import "./config/bridge-setup";
import Config from "react-native-config";

import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useDispatch, useSelector } from "react-redux";
import { init } from "../e2e/bridge/client";
import logger from "./logger";
import {
  osThemeSelector,
  hasSeenAnalyticsOptInPromptSelector,
  hasCompletedOnboardingSelector,
  trackingEnabledSelector,
  reportErrorsEnabledSelector,
  isOnboardingFlowSelector,
} from "~/reducers/settings";
import { accountsSelector } from "~/reducers/accounts";
import { rebootIdSelector } from "~/reducers/appstate";
import LocaleProvider, { i18n } from "~/context/Locale";
import AuthPass from "~/context/AuthPass";
import LedgerStoreProvider from "~/context/LedgerStore";
import { store } from "~/context/store";
import LoadingApp from "~/components/LoadingApp";
import StyledStatusBar from "~/components/StyledStatusBar";
import AnalyticsConsole from "~/components/AnalyticsConsole";
import RtkQueryDevPanel from "~/screens/Settings/Debug/Debugging/RTK";
import DebugTheme from "~/components/DebugTheme";
import SyncNewAccounts from "~/bridge/SyncNewAccounts";
import SegmentSetup from "~/analytics/SegmentSetup";
import HookSentry from "~/components/HookSentry";
import HookNotifications from "~/notifications/HookNotifications";
import RootNavigator from "~/components/RootNavigator";
import SetEnvsFromSettings from "~/components/SetEnvsFromSettings";
import ExperimentalHeader from "~/screens/Settings/Experimental/ExperimentalHeader";
import Modals from "~/screens/Modals";
import NavBarColorHandler from "~/components/NavBarColorHandler";
import { FirebaseRemoteConfigProvider } from "~/components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { TermsAndConditionMigrateLegacyData } from "~/logic/terms";
import HookDynamicContentCards from "~/dynamicContent/useContentCards";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";

import { useListenToHidDevices } from "~/hooks/useListenToHidDevices";
import { DeeplinksProvider } from "~/navigation/DeeplinksProvider";
import StyleProvider from "./StyleProvider";

import {
  setAnalytics,
  setOsTheme,
  setPersonalizedRecommendations,
  setIsOnboardingFlow,
} from "~/actions/settings";
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
import { registerTransports } from "~/services/registerTransports";
import { useDeviceManagementKitEnabled } from "@ledgerhq/live-dmk-mobile";
import { StoragePerformanceOverlay } from "./newArch/storage/screens/PerformanceMonitor";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import AppVersionBlocker from "LLM/features/AppBlockers/components/AppVersionBlocker";
import AppGeoBlocker from "LLM/features/AppBlockers/components/AppGeoBlocker";
import {
  TrackingConsent,
  DatadogProvider,
  AutoInstrumentationConfiguration,
  DdSdkReactNative,
  PropagatorType,
} from "@datadog/mobile-react-native";
import { PartialInitializationConfiguration } from "@datadog/mobile-react-native/lib/typescript/DdSdkReactNativeConfiguration";
import {
  customActionEventMapper,
  customErrorEventMapper,
  customLogEventMapper,
  initializeDatadogProvider,
} from "./datadog";
import { initSentry } from "./sentry";
import getOrCreateUser from "./user";
import { FIRST_PARTY_MAIN_HOST_DOMAIN } from "./utils/constants";
import useNativeStartupInfo from "./hooks/useNativeStartupInfo";
import { ConfigureDBSaveEffects } from "./components/DBSave";

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

function App() {
  const accounts = useSelector(accountsSelector);
  const analyticsFF = useFeature("llmAnalyticsOptInPrompt");
  const datadogFF = useFeature("llmDatadog");
  const sentryFF = useFeature("llmSentry");
  const isLDMKEnabled = useDeviceManagementKitEnabled();
  const providerNumber = useEnv("FORCE_PROVIDER");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isOnboardingFlow = useSelector(isOnboardingFlowSelector);
  const dmk = useDeviceManagementKit();
  const dispatch = useDispatch();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const automaticBugReportingEnabled = useSelector(reportErrorsEnabledSelector);
  useNativeStartupInfo();

  const datadogAutoInstrumentation: AutoInstrumentationConfiguration = useMemo(
    () => ({
      trackErrors: datadogFF?.params?.trackErrors ?? false,
      trackInteractions: datadogFF?.params?.trackInteractions ?? false,
      trackResources: datadogFF?.params?.trackResources ?? false,
      errorEventMapper: customErrorEventMapper(!automaticBugReportingEnabled),
      actionEventMapper: customActionEventMapper,
      logEventMapper: customLogEventMapper,
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
    if (isOnboardingFlow) {
      dispatch(setIsOnboardingFlow(false));
    }
    // set only on initialisation in case user exits onboarding early
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      datadogFF?.params as PartialInitializationConfiguration,
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

  return (
    <>
      <ConfigureDBSaveEffects />
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
      <RtkQueryDevPanel />

      <DebugTheme />
      <Modals />
      <FeatureToggle featureId="llmMmkvMigration">
        <StoragePerformanceOverlay />
      </FeatureToggle>
    </>
  );
}

function RebootProvider({ children }: { children: React.ReactNode }) {
  const rebootId = useSelector(rebootIdSelector);
  return <React.Fragment key={rebootId}>{children}</React.Fragment>;
}

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
  componentDidCatch(e: Error) {
    logger.critical(e);
    throw e;
  }

  onInitFinished = () => {
    if (Config.DETOX) {
      init();
    }
  };

  render() {
    return (
      <LedgerStoreProvider onInitFinished={this.onInitFinished} store={store}>
        {(ready, initialCountervalues) =>
          ready ? (
            <RebootProvider>
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
                            <StorylyProvider>
                              <StylesProvider>
                                <StyledStatusBar />
                                <NavBarColorHandler />
                                <AuthPass>
                                  <GestureHandlerRootView style={styles.root}>
                                    <AppProviders initialCountervalues={initialCountervalues}>
                                      <AppGeoBlocker>
                                        <AppVersionBlocker>
                                          <App />
                                        </AppVersionBlocker>
                                      </AppGeoBlocker>
                                    </AppProviders>
                                  </GestureHandlerRootView>
                                </AuthPass>
                              </StylesProvider>
                            </StorylyProvider>
                          </SafeAreaProvider>
                        </PlatformAppProviderWrapper>
                      </LocaleProvider>
                    </I18nextProvider>
                  </FirebaseFeatureFlagsProvider>
                </FirebaseRemoteConfigProvider>
              </QueuedDrawersContextProvider>
            </RebootProvider>
          ) : (
            <LoadingApp />
          )
        }
      </LedgerStoreProvider>
    );
  }
}
