import { useMemo } from "react";
import { getEnv } from "@shared/env";
import type { KeyRingClientConfig } from "@features/platform-key-ring";
import { useKeyRingRuntime, useLedgerSyncBackends } from "@features/flow-ledger-sync";
import { useInstanceName } from "./useInstanceName";

export type KeyRingClientSetup = Omit<KeyRingClientConfig, "deviceBridge">;

/** What the key ring client of this app is built with, whichever device bridge it uses. */
export function useKeyRingClientSetup(): KeyRingClientSetup {
  const { keyRingApiBaseUrl } = useLedgerSyncBackends();
  const mock = !!getEnv("MOCK");
  const instanceName = useInstanceName();
  const runtime = useKeyRingRuntime();

  return useMemo(
    () => ({ mock, instanceName, apiBaseUrl: keyRingApiBaseUrl, runtime }),
    [mock, instanceName, keyRingApiBaseUrl, runtime],
  );
}
