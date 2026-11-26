import { getEnv } from "@shared/env";
import { useStore } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useInstanceName } from "./useInstanceName";

export type KeyRingClientSetup = Readonly<{
  isMockEnv: boolean;
  instanceName: string;
  trustchainApiBaseUrl: string;
  cloudSyncApiBaseUrl: string;
  getCurrentWSState: () => { data: unknown; version: number };
}>;

/** What the key ring client of this app is built with, read when it is first built. */
export function useKeyRingClientSetup(): KeyRingClientSetup {
  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const instanceName = useInstanceName();
  const isMockEnv = !!getEnv("MOCK");
  const store = useStore();

  return {
    isMockEnv,
    instanceName,
    trustchainApiBaseUrl,
    cloudSyncApiBaseUrl,
    getCurrentWSState: () => walletSelector(store.getState()).walletSync.walletSyncState,
  };
}
