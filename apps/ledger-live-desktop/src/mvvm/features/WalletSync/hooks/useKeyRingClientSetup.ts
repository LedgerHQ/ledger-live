import { getEnv } from "@shared/env";
import { useStore } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useKeyRingRuntime, useLedgerSyncBackends } from "@features/flow-ledger-sync";
import type { KeyRingRuntime } from "@features/platform-key-ring";
import { useInstanceName } from "./useInstanceName";

export type KeyRingClientSetup = Readonly<{
  isMockEnv: boolean;
  instanceName: string;
  trustchainApiBaseUrl: string;
  cloudSyncApiBaseUrl: string;
  getCurrentWSState: () => { data: unknown; version: number };
  runtime: KeyRingRuntime;
}>;

/** What the key ring client of this app is built with, read when it is first built. */
export function useKeyRingClientSetup(): KeyRingClientSetup {
  const { keyRingApiBaseUrl, cloudSyncApiBaseUrl } = useLedgerSyncBackends();
  const instanceName = useInstanceName();
  const isMockEnv = !!getEnv("MOCK");
  const store = useStore();
  const runtime = useKeyRingRuntime();

  return {
    isMockEnv,
    instanceName,
    trustchainApiBaseUrl: keyRingApiBaseUrl,
    cloudSyncApiBaseUrl,
    getCurrentWSState: () => walletSelector(store.getState()).walletSync.walletSyncState,
    runtime,
  };
}
