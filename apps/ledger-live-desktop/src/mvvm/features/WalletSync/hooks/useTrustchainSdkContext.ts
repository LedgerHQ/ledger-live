import { useMemo } from "react";
import { getEnv } from "@shared/env";
import { trustchainLifecycle } from "@features/platform-wallet-sync";
import { useStore } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import type {
  TrustchainLifecycle,
  TrustchainSDKContext,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useInstanceName } from "./useInstanceName";

const LEDGER_SYNC_APPLICATION_ID = 16;

export type TrustchainSdkSetup = Readonly<{
  isMockEnv: boolean;
  context: TrustchainSDKContext;
  lifecycle: TrustchainLifecycle;
}>;

/** What every Ledger Sync SDK of this app is built with, whichever device access it uses. */
export function useTrustchainSdkContext(): TrustchainSdkSetup {
  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const name = useInstanceName();
  const isMockEnv = !!getEnv("MOCK");

  const context = useMemo(
    () => ({ applicationId: LEDGER_SYNC_APPLICATION_ID, name, apiBaseUrl: trustchainApiBaseUrl }),
    [trustchainApiBaseUrl, name],
  );

  const store = useStore();
  const lifecycle = useMemo(
    () =>
      trustchainLifecycle({
        cloudSyncApiBaseUrl,
        getCurrentWSState: () => walletSelector(store.getState()).walletSync.walletSyncState,
      }),
    [cloudSyncApiBaseUrl, store],
  );

  return useMemo(() => ({ isMockEnv, context, lifecycle }), [isMockEnv, context, lifecycle]);
}
