import "LLM/utils/logStartup/beforeJSImports";
require("./promise-polyfill");
import "./polyfill";
import "./live-common-setup";
import "./iosWebsocketFix";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { Component, useMemo, useEffect, useRef } from "react";
import { StyleSheet, LogBox, Appearance, AppState, View } from "react-native";
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
import { init } from "../e2e/bridge/client";
import logger from "./logger";
import { BridgeSyncProvider } from "~/bridge/BridgeSyncContext";
import {
  hasSeenAnalyticsOptInPromptSelector,
  hasCompletedOnboardingSelector,
  trackingEnabledSelector,
  reportErrorsEnabledSelector,
  isOnboardingFlowSelector,
  isPostOnboardingFlowSelector,
} from "~/reducers/settings";
import { accountsSelector } from "~/reducers/accounts";
import { rebootIdSelector } from "~/reducers/appstate";
import LocaleProvider, { i18n } from "~/context/Locale";
import AuthPass from "~/context/AuthPass";
import LedgerStoreProvider from "~/context/LedgerStore";
import { useSelector, useDispatch } from "~/context/hooks";
import { store } from "~/context/store";
import LoadingApp from "~/components/LoadingApp";
import StyledStatusBar from "~/components/StyledStatusBar";
import AnalyticsConsole from "~/components/AnalyticsConsole";
import DebugTheme from "~/components/DebugTheme";
import SyncNewAccounts from "~/bridge/SyncNewAccounts";
import SegmentSetup from "~/analytics/SegmentSetup";
import HookNotifications from "~/notifications/HookNotifications";
import RootNavigator from "~/components/RootNavigator";
import SetEnvsFromSettings from "~/components/SetEnvsFromSettings";
import ExperimentalHeader from "~/screens/Settings/Experimental/ExperimentalHeader";
import Modals from "~/screens/Modals";
import NavBarColorHandler from "~/components/NavBarColorHandler";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { TermsAndConditionMigrateLegacyData } from "~/logic/terms";
import HookDynamicContentCards from "~/dynamicContent/useContentCards";
import { ModalSystemPrimer } from "LLM/components/ModalSystemPrimer";
import PlatformAppProviderWrapper from "./PlatformAppProviderWrapper";

import { DeeplinksProvider } from "~/navigation/DeeplinksProvider";
import StyleProvider from "./StyleProvider";

import {
  setAnalytics,
  setOsTheme,
  setPersonalizedRecommendations,
  setIsOnboardingFlow,
  setIsPostOnboardingFlow,
} from "~/actions/settings";
import TransactionsAlerts from "~/components/TransactionsAlerts";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { updateIdentify } from "./analytics";
import { FeatureToggle, getFeature, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSettings } from "~/hooks";
import AppProviders from "./AppProviders";
import { useAutoDismissPostOnboardingEntryPoint } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import QueuedDrawersContextProvider from "LLM/components/QueuedDrawer/QueuedDrawersContextProvider";
import { registerTransports } from "~/services/registerTransports";
import { useDeviceManagementKitEnabled } from "@ledgerhq/live-dmk-mobile";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { WaitForAppReady } from "LLM/contexts/WaitForAppReady";
import AppVersionBlocker from "LLM/features/AppBlockers/components/AppVersionBlocker";
import AppGeoBlocker from "LLM/features/AppBlockers/components/AppGeoBlocker";
import { StoragePerformanceOverlay } from "LLM/storage/screens/PerformanceMonitor";
import { logStartupEvent } from "LLM/utils/logStartupTime";
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
import getOrCreateUser from "./user";
import { FIRST_PARTY_MAIN_HOST_DOMAIN } from "./utils/constants";
import { ConfigureDBSaveEffects } from "./components/DBSave";
import HookDevTools from "./devTools/useDevTools";
import { setSolanaLdmkEnabled } from "@ledgerhq/live-common/families/solana/setup";
import useCheckAccountWithFunds from "./logic/postOnboarding/useCheckAccountWithFunds";

logStartupEvent("After js imports");

if (Config.DISABLE_YELLOW_BOX) {
  LogBox.ignoreAllLogs();
}

checkLibs({
  NotEnoughBalance,
  // @ts-expect-error REACT19FIXME: React.createFactory removed but still expected by React 18 types
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
  logStartupEvent("App render");
  const accounts = useSelector(accountsSelector);
  const analyticsFF = useFeature("llmAnalyticsOptInPrompt");
  const datadogFF = useFeature("llmDatadog");
  const isLDMKEnabled = useDeviceManagementKitEnabled();
  const providerNumber = useEnv("FORCE_PROVIDER");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isOnboardingFlow = useSelector(isOnboardingFlowSelector);
  const isPostOnboardingFlow = useSelector(isPostOnboardingFlowSelector);
  const initiatedIsOnboardingFlow = useRef<boolean>(isOnboardingFlow);
  const initiatedIsPostOnboardingFlow = useRef<boolean>(isPostOnboardingFlow);
  const dmk = useDeviceManagementKit();
  const dispatch = useDispatch();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const automaticBugReportingEnabled = useSelector(reportErrorsEnabledSelector);
  const ldmkSolanaSignerFeatureFlag = useFeature("ldmkSolanaSigner");

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
    if (typeof ldmkSolanaSignerFeatureFlag?.enabled === "boolean") {
      setSolanaLdmkEnabled(ldmkSolanaSignerFeatureFlag?.enabled);
    }
  }, [ldmkSolanaSignerFeatureFlag]);

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
    /*
    / To capture all tracking events under the same flow we have these states set
    / and to prevent the flow state leaking we reset them here
    */
    if (initiatedIsOnboardingFlow.current) {
      dispatch(setIsOnboardingFlow(false));
    }
    if (initiatedIsPostOnboardingFlow.current) {
      dispatch(setIsPostOnboardingFlow(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!datadogFF?.enabled) return;
    const setUserEquipmentId = async () => {
      const { user } = await getOrCreateUser();
      if (!user) return;
      const { datadogId } = user;
      DdSdkReactNative.setUserInfo({
        id: datadogId,
      });
    };
    initializeDatadogProvider(
      {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        ...(datadogFF?.params as PartialInitializationConfiguration),
        ...(Config.FORCE_DATADOG_SAMPLE_RATE_100 ? { sessionSamplingRate: 100 } : {}),
      },
      isTrackingEnabled ? TrackingConsent.GRANTED : TrackingConsent.NOT_GRANTED,
    )
      .then(setUserEquipmentId)
      .catch(e => {
        console.error("Datadog initialization failed", e);
      });
  }, [datadogFF?.params, datadogFF?.enabled, isTrackingEnabled]);

  const checkAccountsWithFunds = useCheckAccountWithFunds();

  useAccountsWithFundsListener(accounts, updateIdentify, checkAccountsWithFunds);
  useFetchCurrencyAll();
  useFetchCurrencyFrom();
  useAutoDismissPostOnboardingEntryPoint();

  return (
    <>
      <ConfigureDBSaveEffects />
      <SyncNewAccounts priority={5} />
      <TransactionsAlerts />
      {datadogFF?.enabled ? (
        <DatadogProvider configuration={datadogAutoInstrumentation}>
          <AppView />
        </DatadogProvider>
      ) : (
        <AppView />
      )}

      <AnalyticsConsole />

      <DebugTheme />
      <Modals />
      <FeatureToggle featureId="llmMmkvMigration">
        <StoragePerformanceOverlay />
      </FeatureToggle>
    </>
  );
}

/**
 * AppView is used to wrap the experimental header and the root navigator.
 * Both the experimental header and the root navigator must be taken into
 * account when calculating screen offsets or insets (e.g. KeyboardView or
 * SafeAreaView).
 */
function AppView() {
  // TODO: Normally, we should use a SafeAreaView as root view to avoid
  // importing it everywhere and recalculating the insets.
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
      }}
    >
      <ExperimentalHeader />
      <View style={{ flex: 1 }}>
        <RootNavigator />
      </View>
    </View>
  );
}

function RebootProvider({ children }: { children: React.ReactNode }) {
  const rebootId = useSelector(rebootIdSelector);
  return <React.Fragment key={rebootId}>{children}</React.Fragment>;
}

const StylesProvider = ({ children }: { children: React.ReactNode }) => {
  const { osTheme, resolvedTheme } = useSettings();
  const dispatch = useDispatch();
  const hasCheckedOnMountRef = useRef(false);
  const osThemeRef = useRef(osTheme);

  // Keep osThemeRef in sync with Redux state
  osThemeRef.current = osTheme;

  useEffect(() => {
    const compareOsTheme = () => {
      const currentOsTheme = Appearance.getColorScheme();
      // Only dispatch if the OS theme is different from what's stored in Redux
      if (currentOsTheme && osThemeRef.current !== currentOsTheme) {
        dispatch(setOsTheme(currentOsTheme));
      }
    };

    // Check on mount only once
    if (!hasCheckedOnMountRef.current) {
      hasCheckedOnMountRef.current = true;
      compareOsTheme();
    }

    const osThemeChangeHandler = (nextAppState: string) => {
      if (nextAppState === "active") {
        compareOsTheme();
      }
    };

    const sub = AppState.addEventListener("change", osThemeChangeHandler);
    return () => sub.remove();
  }, [dispatch]);

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
    logStartupEvent("Root render");
    return (
      <LedgerStoreProvider onInitFinished={this.onInitFinished} store={store}>
        {({ ready, initialCountervalues, currencyInitialized }) =>
          ready ? (
            <RebootProvider>
              <SetEnvsFromSettings />
              <SegmentSetup />
              <HookNotifications />
              <HookDynamicContentCards />
              <HookDevTools />
              <TermsAndConditionMigrateLegacyData />
              <QueuedDrawersContextProvider>
                <FirebaseFeatureFlagsProvider getFeature={getFeature}>
                  <I18nextProvider i18n={i18n}>
                    <LocaleProvider>
                      <PlatformAppProviderWrapper>
                        <SafeAreaProvider>
                          <ModalSystemPrimer />
                          <StylesProvider>
                            <StyledStatusBar />
                            <NavBarColorHandler />
                            <AuthPass>
                              <GestureHandlerRootView style={styles.root}>
                                <WaitForAppReady currencyInitialized={currencyInitialized}>
                                  <AppProviders initialCountervalues={initialCountervalues}>
                                    <AppGeoBlocker>
                                      <AppVersionBlocker>
                                        <BridgeSyncProvider>
                                          <App />
                                        </BridgeSyncProvider>
                                      </AppVersionBlocker>
                                    </AppGeoBlocker>
                                  </AppProviders>
                                </WaitForAppReady>
                              </GestureHandlerRootView>
                            </AuthPass>
                          </StylesProvider>
                        </SafeAreaProvider>
                      </PlatformAppProviderWrapper>
                    </LocaleProvider>
                  </I18nextProvider>
                </FirebaseFeatureFlagsProvider>
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
