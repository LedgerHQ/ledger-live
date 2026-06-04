import { useMemo } from "react";
import { getEnv } from "@ledgerhq/live-env";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { trustchainLifecycle } from "@ledgerhq/live-wallet/walletsync/index";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { walletSyncStateSelector } from "@ledgerhq/live-wallet/store";
import { walletSelector } from "~/reducers/wallet";
import { useStore } from "~/context/hooks";
import { useInstanceName } from "./useInstanceName";

export function useTrustchainSdk() {
  const featureWalletSync = useFeature("llmWalletSync");
  const environment = featureWalletSync?.params?.environment;
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(environment);
  const isMockEnv = !!getEnv("MOCK");
  const instanceName = useInstanceName();
  const store = useStore();

  const defaultContext = useMemo(() => {
    const applicationId = 16;

    const name = instanceName;
    return { applicationId, name, apiBaseUrl: trustchainApiBaseUrl };
  }, [trustchainApiBaseUrl, instanceName]);

  const lifecycle = useMemo(
    () =>
      trustchainLifecycle({
        cloudSyncApiBaseUrl,
        getCurrentWSState: () => walletSyncStateSelector(walletSelector(store.getState())),
      }),
    [cloudSyncApiBaseUrl, store],
  );

  return useMemo(
    () => getSdk(isMockEnv, defaultContext, withDevice, lifecycle),
    [isMockEnv, defaultContext, lifecycle],
  );
}
