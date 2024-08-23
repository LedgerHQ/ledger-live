import os from "os";
import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/trustchain/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { trustchainLifecycle } from "@ledgerhq/live-wallet/walletsync/index";
import { useStore } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { walletSyncStateSelector } from "@ledgerhq/live-wallet/store";
import { TrustchainSDK } from "@ledgerhq/trustchain/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

const platformMap: Record<string, string | undefined> = {
  darwin: "Mac",
  win32: "Windows",
  linux: "Linux",
};

let sdkInstance: TrustchainSDK | null = null;

export function useTrustchainSdk() {
  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const isMockEnv = !!getEnv("MOCK");

  const defaultContext = useMemo(() => {
    const applicationId = 16;
    const platform = os.platform();
    const hostname = os.hostname();
    const name = `${platformMap[platform] || platform}${hostname ? " " + hostname : ""}`;
    return { applicationId, name, apiBaseUrl: trustchainApiBaseUrl };
  }, [trustchainApiBaseUrl]);

  const store = useStore();
  const lifecycle = useMemo(
    () =>
      trustchainLifecycle({
        cloudSyncApiBaseUrl,
        getCurrentWSState: () => walletSyncStateSelector(walletSelector(store.getState())),
      }),
    [cloudSyncApiBaseUrl, store],
  );

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, withDevice, lifecycle);
  }

  return sdkInstance;
}
