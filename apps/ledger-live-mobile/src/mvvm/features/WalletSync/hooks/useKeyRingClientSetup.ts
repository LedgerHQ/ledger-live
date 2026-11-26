import { useMemo } from "react";
import { getEnv } from "@shared/env";
import type { KeyRingClientConfig } from "@features/platform-key-ring";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useInstanceName } from "./useInstanceName";

export type KeyRingClientSetup = Omit<KeyRingClientConfig, "deviceBridge">;

/** What the key ring client of this app is built with, whichever device bridge it uses. */
export function useKeyRingClientSetup(): KeyRingClientSetup {
  const featureWalletSync = useFeature("llmWalletSync");
  const environment = featureWalletSync?.params?.environment;
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(environment);
  const mock = !!getEnv("MOCK");
  const instanceName = useInstanceName();

  return useMemo(
    () => ({ mock, instanceName, apiBaseUrl: trustchainApiBaseUrl }),
    [mock, instanceName, trustchainApiBaseUrl],
  );
}
