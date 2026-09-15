import { useLayoutEffect, useMemo } from "react";
import { getEnv } from "@shared/env";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  lkrpEnvironmentSelector,
  setLkrpEnvironment,
  type LkrpEnvironment,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { trustchainLifecycle } from "@features/platform-wallet-sync";
import { useStore } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useInstanceName } from "./useInstanceName";

let sdkInstance: TrustchainSDK | null = null;
let instanceEnvironment: LkrpEnvironment | null = null;

export function useTrustchainSdk() {
  const featureWalletSync = useFeature("lldWalletSync");
  const environment: LkrpEnvironment =
    featureWalletSync?.params?.environment === "STAGING" ? "STAGING" : "PROD";
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(environment);
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

  useLayoutEffect(() => {
    if (lkrpEnvironmentSelector(store.getState()) || !instanceEnvironment) return;
    store.dispatch(setLkrpEnvironment(instanceEnvironment));
  }, [store]);

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, withDevice, lifecycle);
    instanceEnvironment = environment;
  }

  return sdkInstance;
}
