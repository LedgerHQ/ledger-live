import { getEnv } from "@ledgerhq/live-env";

// Lazy accessor so the env var is read at call-time, not at module load.
export function getCountervaluesApiBaseUrl(): string {
  return getEnv("LEDGER_COUNTERVALUES_API");
}
