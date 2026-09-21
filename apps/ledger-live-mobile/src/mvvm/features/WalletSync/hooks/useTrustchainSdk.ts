import { useMemo } from "react";
import { getEnv } from "@shared/env";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { getWalletSyncEnvironmentParams } from "@features/platform-wallet-sync";
import { walletSyncEnvironment } from "~/config/walletSync";
import { useInstanceName } from "./useInstanceName";

let sdkInstance: TrustchainSDK | null = null;

export function useTrustchainSdk() {
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(walletSyncEnvironment);
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
