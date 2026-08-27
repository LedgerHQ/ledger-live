import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import Config from "react-native-config";
import useEnv from "@features/platform-env";
import {
  trackingEnabledSelector,
  reportErrorsEnabledSelector,
  isOnboardingFlowSelector,
  isPostOnboardingFlowSelector,
} from "~/reducers/settings";
import { accountsSelector } from "~/reducers/accounts";
import AnalyticsConsole from "~/components/AnalyticsConsole";
import DebugTheme from "~/components/DebugTheme";
import SyncNewAccounts from "~/bridge/SyncNewAccounts";
import SegmentSetup from "~/analytics/SegmentSetup";
import HookNotifications from "~/notifications/HookNotifications";
import Modals from "~/screens/Modals";
import { TermsAndConditionMigrateLegacyData } from "~/logic/terms";
import HookDynamicContentCards from "~/dynamicContent/useContentCards";
import { JsThreadMonitor } from "LLM/components/JsThreadMonitor";
import TransactionsAlerts from "~/components/TransactionsAlerts";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { useTrackFundsReceived } from "LLM/features/Analytics/hooks/useTrackFundsReceived";
import { updateIdentify } from "./analytics";
import { FeatureToggle, useFeature } from "@features/platform-feature-flags";
import { setIsOnboardingFlow, setIsPostOnboardingFlow } from "~/actions/settings";
import { useAutoDismissPostOnboardingEntryPoint } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { registerTransports } from "~/services/registerTransports";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { StoragePerformanceOverlay } from "LLM/storage/screens/PerformanceMonitor";
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
import { datadogIdSelector, isDummyDatadogId } from "@domain/entity-client-identity";
import { FIRST_PARTY_MAIN_HOST_DOMAIN } from "./utils/constants";
import { ConfigureDBSaveEffects } from "./components/DBSave";
import HookDevTools from "./devTools/useDevTools";
import {
  setSolanaLdmkEnabled,
  setSolanaTxcEnabled,
} from "@ledgerhq/live-common/families/solana/setup";
import { setCosmosLdmkEnabled } from "@ledgerhq/live-common/families/cosmos/setup";
import { resolveSuiTransport, setSuiTransport } from "@ledgerhq/live-common/families/sui/setup";
import useCheckAccountWithFunds from "./logic/postOnboarding/useCheckAccountWithFunds";
import { useAutoFinishPostOnboarding } from "LLM/features/PostOnboarding/hooks/useAutoFinishPostOnboarding";

export function DeferredAppServices() {
  const accounts = useSelector(accountsSelector);
  const datadogFF = useFeature("llmDatadog");
  const providerNumber = useEnv("FORCE_PROVIDER");
  const isOnboardingFlow = useSelector(isOnboardingFlowSelector);
  const isPostOnboardingFlow = useSelector(isPostOnboardingFlowSelector);
  const initiatedIsOnboardingFlow = React.useRef<boolean>(isOnboardingFlow);
  const initiatedIsPostOnboardingFlow = React.useRef<boolean>(isPostOnboardingFlow);
  const dmk = useDeviceManagementKit();
  const dispatch = useDispatch();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const automaticBugReportingEnabled = useSelector(reportErrorsEnabledSelector);
  const datadogId = useSelector(datadogIdSelector);
  const ldmkSolanaSignerFeatureFlag = useFeature("ldmkSolanaSigner");
  const ldmkSolanaSignerIsTxcActiveFeatureFlag = useFeature("ldmkSolanaSignerIsTxcActive");
  const ldmkCosmosSignerFeatureFlag = useFeature("ldmkCosmosSigner");
  const suiTransportFeatureFlag = useFeature("suiTransport");
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
    if (typeof ldmkSolanaSignerIsTxcActiveFeatureFlag?.enabled === "boolean") {
      setSolanaTxcEnabled(ldmkSolanaSignerIsTxcActiveFeatureFlag?.enabled);
    }
  }, [ldmkSolanaSignerIsTxcActiveFeatureFlag]);

  useEffect(() => {
    if (typeof ldmkCosmosSignerFeatureFlag?.enabled === "boolean") {
      setCosmosLdmkEnabled(ldmkCosmosSignerFeatureFlag.enabled);
    }
  }, [ldmkCosmosSignerFeatureFlag]);

  useEffect(() => {
    setSuiTransport(resolveSuiTransport(suiTransportFeatureFlag));
  }, [suiTransportFeatureFlag]);

  useEffect(() => {
    if (providerNumber) {
      dmk?.setProvider(providerNumber);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [dmk, providerNumber]);

  useEffect(() => registerTransports(), []);

  useEffect(() => {
    if (initiatedIsOnboardingFlow.current) {
      dispatch(setIsOnboardingFlow(false));
    }
    if (initiatedIsPostOnboardingFlow.current) {
      dispatch(setIsPostOnboardingFlow(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!datadogFF?.enabled) return;
    const setUserEquipmentId = () => {
      if (isDummyDatadogId(datadogId)) return;
      DdSdkReactNative.setUserInfo({
        id: datadogId.exportDatadogIdForRumUser(),
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
  }, [datadogFF?.params, datadogFF?.enabled, isTrackingEnabled, datadogId]);

  const checkAccountsWithFunds = useCheckAccountWithFunds();

  useAccountsWithFundsListener(accounts, updateIdentify, checkAccountsWithFunds);
  useTrackFundsReceived();
  useFetchCurrencyAll();
  useFetchCurrencyFrom();
  useAutoDismissPostOnboardingEntryPoint();
  useAutoFinishPostOnboarding();

  return (
    <>
      <SegmentSetup />
      <HookNotifications />
      <HookDynamicContentCards />
      <HookDevTools />
      <TermsAndConditionMigrateLegacyData />
      <ConfigureDBSaveEffects />
      <SyncNewAccounts priority={5} />
      <TransactionsAlerts />
      {datadogFF?.enabled ? (
        <DatadogProvider configuration={datadogAutoInstrumentation}>{null}</DatadogProvider>
      ) : null}
      <AnalyticsConsole />
      <DebugTheme />
      <JsThreadMonitor />
      <Modals />
      <FeatureToggle featureId="llmMmkvMigration">
        <StoragePerformanceOverlay />
      </FeatureToggle>
    </>
  );
}
