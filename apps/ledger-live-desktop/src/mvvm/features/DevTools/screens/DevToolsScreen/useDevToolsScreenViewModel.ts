import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  setTrustchain,
  setMemberCredentials,
  resetTrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { Trustchain, MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import {
  useFeatureFlagsToolProps,
  usePayCardToolProps,
  useEnvDevToolProps,
  useProdToggle,
  useTrustchainDevToolProps,
  useCloudSyncDevToolProps,
  useAccountBalancesToolProps,
} from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";
import { useDevToolsRelay } from "./useDevToolsRelay";
import { useAccountBalancesInputs } from "./useAccountBalancesInputs";

const APPLICATION_ID = 16;

export function useDevToolsScreenViewModel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const featureFlagsToolProps = useFeatureFlagsToolProps();
  const payCardToolProps = usePayCardToolProps();
  const envToolProps = useEnvDevToolProps();
  const prodToggle = useProdToggle();
  const { wire, wireState } = useDevToolsRelay();
  const accountBalancesToolProps = useAccountBalancesToolProps(useAccountBalancesInputs());

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

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsToolProps },
      { id: "env", config: envToolProps },
      { id: "pay-card", config: payCardToolProps },
      { id: "trustchain", config: trustchainToolProps },
      { id: "cloud-sync", config: cloudSyncToolProps },
      { id: "account-balances", config: accountBalancesToolProps },
    ],
    [
      featureFlagsToolProps,
      envToolProps,
      payCardToolProps,
      trustchainToolProps,
      cloudSyncToolProps,
      accountBalancesToolProps,
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
