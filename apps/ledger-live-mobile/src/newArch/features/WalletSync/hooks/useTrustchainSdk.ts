import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useInstanceName } from "./useInstanceName";

let sdkInstance: TrustchainSDK | null = null;

export function useTrustchainSdk() {
  const featureWalletSync = useFeature("llmWalletSync");
  const environment = featureWalletSync?.params?.environment;
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(environment);
  const isMockEnv = !!getEnv("MOCK");
  const instanceName = useInstanceName();

  const defaultContext = useMemo(() => {
    const applicationId = 16;

    const name = instanceName;
    return { applicationId, name, apiBaseUrl: trustchainApiBaseUrl };
  }, [trustchainApiBaseUrl, instanceName]);

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, withDevice);
  }

  return sdkInstance;
}
