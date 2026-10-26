import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useNavigate } from "react-router";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  setTrustchain,
  setMemberCredentials,
  resetTrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { Trustchain, MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getEnv } from "@shared/env";
import {
  useFeatureFlagsToolProps,
  usePayCardToolProps,
  useEnvDevToolProps,
  useProdToggle,
  useTrustchainDevToolProps,
  useCloudSyncDevToolProps,
  useAccountBalanceToolProps,
  useAccountPortfolioToolProps,
  useAccountDescriptorToolProps,
  useAccountDataToolProps,
  useAppConfigToolProps,
  useAccountNameToolProps,
} from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";
import { useDevToolsRelay } from "./useDevToolsRelay";
import { useDeviceOnboarding } from "../../../DeviceOnboarding/hooks/useDeviceOnboarding";
import { accountDataRecorder } from "~/config/account-data-setup";
import { getPortfolioServiceUrl } from "~/config/portfolioService";

const APPLICATION_ID = 16;

export function useDevToolsScreenViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const featureFlagsToolProps = useFeatureFlagsToolProps();
  const payCardToolProps = usePayCardToolProps();
  const envToolProps = useEnvDevToolProps();
  const appConfigToolProps = useAppConfigToolProps();
  const prodToggle = useProdToggle();
  const { wire, wireState } = useDevToolsRelay();

  const createTrustchainSdk = useCallback<Parameters<typeof useTrustchainDevToolProps>[0]>(
    ({ trustchainApiBaseUrl }) =>
      getSdk(
        false,
        { applicationId: APPLICATION_ID, name: "DevTools", apiBaseUrl: trustchainApiBaseUrl },
        withDevice,
      ),
    [],
  );

  const createCloudSyncSdk = useCallback<Parameters<typeof useCloudSyncDevToolProps>[0]>(
    ({ trustchainApiBaseUrl }) =>
      getSdk(
        false,
        { applicationId: APPLICATION_ID, name: "DevTools", apiBaseUrl: trustchainApiBaseUrl },
        withDevice,
      ),
    [],
  );

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
    createTrustchainSdk,
    prodToggle.trustchainApiBaseUrl,
    onTrustchainChange,
    onMemberCredentialsChange,
  );

  const cloudSyncToolProps = useCloudSyncDevToolProps(
    createCloudSyncSdk,
    prodToggle.cloudSyncApiBaseUrl,
    prodToggle.trustchainApiBaseUrl,
  );
  const deviceOnboardingProps = useDeviceOnboarding();
  const accountDescriptorToolProps = useAccountDescriptorToolProps();
  const accountBalanceToolProps = useAccountBalanceToolProps();
  const accountPortfolioToolProps = useAccountPortfolioToolProps({
    serviceUrl: getPortfolioServiceUrl(getEnv("PORTFOLIO_SERVICE_URL")),
  });
  const accountDataToolProps = useAccountDataToolProps(accountDataRecorder);
  const legacyAccounts = useSelector(accountsSelector);
  const accountNameToolProps = useAccountNameToolProps(legacyAccounts);

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsToolProps },
      { id: "env", config: envToolProps },
      { id: "app-config", config: appConfigToolProps },
      { id: "pay-card", config: payCardToolProps },
      { id: "trustchain", config: trustchainToolProps },
      { id: "cloud-sync", config: cloudSyncToolProps },
      { id: "device-onboarding", config: deviceOnboardingProps },
      { id: "account-data", config: accountDataToolProps },
      { id: "account-descriptor", config: accountDescriptorToolProps },
      { id: "account-balance", config: accountBalanceToolProps },
      { id: "account-name", config: accountNameToolProps },
      { id: "account-portfolio", config: accountPortfolioToolProps },
    ],
    [
      featureFlagsToolProps,
      envToolProps,
      appConfigToolProps,
      payCardToolProps,
      trustchainToolProps,
      cloudSyncToolProps,
      deviceOnboardingProps,
      accountDescriptorToolProps,
      accountBalanceToolProps,
      accountPortfolioToolProps,
      accountDataToolProps,
      accountNameToolProps,
    ],
  );

  const onClose = useCallback(() => navigate(-1), [navigate]);

  return {
    config,
    onClose,
    transport: wire.transport,
    hubUrl: wireState.hubUrl,
    setHubUrl: wire.setHubUrl,
    role: wireState.role,
  };
}
