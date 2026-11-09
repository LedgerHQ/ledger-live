import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useNavigate } from "react-router";
import {
  setTrustchain,
  setMemberCredentials,
  resetTrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { Trustchain, MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getLkrpSdk } from "@features/platform-wallet-sync";
import { appConfigSessionSelector } from "@shared/app-config";
import {
  useFeatureFlagsToolProps,
  usePayCardToolProps,
  useEnvDevToolProps,
  useTrustchainDevToolProps,
  useCloudSyncDevToolProps,
  useAccountBalanceToolProps,
  useAccountOperationToolProps,
  useAccountBalanceHistoryToolProps,
  useAccountPortfolioToolProps,
  useAccountDescriptorToolProps,
  useAccountDataToolProps,
  useAppConfigToolProps,
  useAccountNameToolProps,
  useMockAccountsToolProps,
  useAccountDetailToolProps,
  useCoinConfigToolProps,
} from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";
import { useDevToolsRelay } from "./useDevToolsRelay";
import { useDeviceOnboardingTool } from "../../DeviceOnboarding/useDeviceOnboardingTool";
import { useAccountDataRecorder } from "../../accountDataRecorder";
import { getPortfolioServiceUrl } from "~/config/portfolioService";

const getLiveConfigValue = (key: string): unknown => LiveConfig.getValueByKey(key);
const getLiveConfigDefaultValue = (key: string): unknown => LiveConfig.getDefaultValueByKey(key);

export function useDevToolsScreenViewModel(onCloseOverride?: () => void) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const featureFlagsToolProps = useFeatureFlagsToolProps();
  const payCardToolProps = usePayCardToolProps();
  const envToolProps = useEnvDevToolProps();
  const appConfigToolProps = useAppConfigToolProps();
  const liveConfigKeys = useMemo(() => Object.keys(LiveConfig.instance.config), []);
  const coinConfigToolProps = useCoinConfigToolProps({
    keys: liveConfigKeys,
    getValueByKey: getLiveConfigValue,
    getDefaultValueByKey: getLiveConfigDefaultValue,
  });
  // The Ledger Sync tools run on the backends of the app's live trustchain.
  const appConfigValues = useSelector(appConfigSessionSelector)?.values;
  const trustchainUrl = urlOf(appConfigValues, "trustchainApiBaseUrl");
  const cloudSyncUrl = urlOf(appConfigValues, "cloudSyncApiBaseUrl");
  const { wire, wireState } = useDevToolsRelay();

  // The tools act as the app's member, so they run on the store's LKRP SDK.
  const createSdk = useCallback(() => getLkrpSdk(dispatch), [dispatch]);

  const onTrustchainChange = useCallback(
    (tc: Trustchain | null) => {
      if (tc !== null) dispatch(setTrustchain(tc));
      // null = devtool cleared trustchain locally; no Redux dispatch to avoid
      // silently rotating memberCredentials via resetTrustchainStore.
    },
    [dispatch],
  );

  const onMemberCredentialsChange = useCallback(
    (mc: MemberCredentials | null) => {
      if (mc !== null) dispatch(setMemberCredentials(mc));
      else dispatch(resetTrustchainStore());
    },
    [dispatch],
  );

  const trustchainToolProps = useTrustchainDevToolProps(
    createSdk,
    trustchainUrl,
    onTrustchainChange,
    onMemberCredentialsChange,
  );

  const cloudSyncToolProps = useCloudSyncDevToolProps(createSdk, cloudSyncUrl, trustchainUrl);
  const deviceOnboardingProps = useDeviceOnboardingTool();
  const accountDescriptorToolProps = useAccountDescriptorToolProps();
  const accountBalanceToolProps = useAccountBalanceToolProps();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const accountOperationToolProps = useAccountOperationToolProps(counterValueCurrency.ticker);
  const accountBalanceHistoryToolProps = useAccountBalanceHistoryToolProps();
  const accountPortfolioToolProps = useAccountPortfolioToolProps({
    serviceUrl: getPortfolioServiceUrl(),
  });
  const accountDataRecorder = useAccountDataRecorder();
  const accountDataToolProps = useAccountDataToolProps(accountDataRecorder);
  const legacyAccounts = useSelector(accountsSelector);
  const accountNameToolProps = useAccountNameToolProps(legacyAccounts);
  const mockAccountsToolProps = useMockAccountsToolProps(accountDataRecorder);
  const accountDetailToolProps = useAccountDetailToolProps();

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsToolProps },
      { id: "env", config: envToolProps },
      { id: "app-config", config: appConfigToolProps },
      { id: "coin-config", config: coinConfigToolProps },
      { id: "pay-card", config: payCardToolProps },
      { id: "trustchain", config: trustchainToolProps },
      { id: "cloud-sync", config: cloudSyncToolProps },
      { id: "device-onboarding", config: deviceOnboardingProps },
      { id: "account-data", config: accountDataToolProps },
      { id: "account-descriptor", config: accountDescriptorToolProps },
      { id: "account-balance", config: accountBalanceToolProps },
      { id: "account-operation", config: accountOperationToolProps },
      { id: "account-balance-history", config: accountBalanceHistoryToolProps },
      { id: "account-name", config: accountNameToolProps },
      { id: "account-portfolio", config: accountPortfolioToolProps },
      { id: "mock-accounts", config: mockAccountsToolProps },
      { id: "account-detail", config: accountDetailToolProps },
    ],
    [
      featureFlagsToolProps,
      envToolProps,
      appConfigToolProps,
      coinConfigToolProps,
      payCardToolProps,
      trustchainToolProps,
      cloudSyncToolProps,
      deviceOnboardingProps,
      accountDescriptorToolProps,
      accountBalanceToolProps,
      accountOperationToolProps,
      accountBalanceHistoryToolProps,
      accountPortfolioToolProps,
      accountDataToolProps,
      accountNameToolProps,
      mockAccountsToolProps,
      accountDetailToolProps,
    ],
  );

  const navigateBack = useCallback(() => navigate(-1), [navigate]);
  const onClose = onCloseOverride ?? navigateBack;

  return {
    config,
    onClose,
    transport: wire.transport,
    hubUrl: wireState.hubUrl,
    setHubUrl: wire.setHubUrl,
    role: wireState.role,
  };
}

/** Empty until the app config middleware sets the session, a microtask after the store is created. */
function urlOf(values: Readonly<Record<string, unknown>> | undefined, name: string): string {
  const value = values?.[name];
  return typeof value === "string" ? value : "";
}
