import { useMemo } from "react";
import { getEnv } from "@shared/env";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import {
  getWalletSyncEnvironmentParams,
  trustchainLifecycle,
} from "@features/platform-wallet-sync";
import { useStore } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { walletSyncEnvironment } from "~/config/walletSync";
import { useInstanceName } from "./useInstanceName";

let sdkInstance: TrustchainSDK | null = null;

export function useTrustchainSdk() {
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } =
    getWalletSyncEnvironmentParams(walletSyncEnvironment);
  const name = useInstanceName();
  const isMockEnv = !!getEnv("MOCK");

  const defaultContext = useMemo(() => {
    const applicationId = 16;
    return { applicationId, name, apiBaseUrl: trustchainApiBaseUrl };
  }, [trustchainApiBaseUrl, name]);

  const store = useStore();
  const lifecycle = useMemo(
    () =>
      trustchainLifecycle({
        cloudSyncApiBaseUrl,
        getCurrentWSState: () => walletSelector(store.getState()).walletSync.walletSyncState,
      }),
    [cloudSyncApiBaseUrl, store],
  );

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, withDevice, lifecycle);
  }

  return sdkInstance;
}
