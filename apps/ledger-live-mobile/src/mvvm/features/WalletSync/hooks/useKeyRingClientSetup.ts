import { useMemo } from "react";
import { getEnv } from "@shared/env";
import type { KeyRingClientConfig } from "@features/platform-key-ring";
import { useLedgerSyncBackends } from "@features/flow-ledger-sync";
import { useInstanceName } from "./useInstanceName";

export type KeyRingClientSetup = Omit<KeyRingClientConfig, "deviceBridge">;

/** What the key ring client of this app is built with, whichever device bridge it uses. */
export function useKeyRingClientSetup(): KeyRingClientSetup {
  const { keyRingApiBaseUrl } = useLedgerSyncBackends();
  const mock = !!getEnv("MOCK");
  const instanceName = useInstanceName();

  return useMemo(
    () => ({ mock, instanceName, apiBaseUrl: keyRingApiBaseUrl }),
    [mock, instanceName, keyRingApiBaseUrl],
  );
}
