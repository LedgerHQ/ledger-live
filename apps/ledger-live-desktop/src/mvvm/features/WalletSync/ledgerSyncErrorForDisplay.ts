import { keyRingErrorForDisplay } from "@features/platform-key-ring";

/** The error an error screen shows for a Ledger Sync failure, with its existing translation. */
export function ledgerSyncErrorForDisplay(error: Error): Error {
  const displayed = keyRingErrorForDisplay(error);
  return displayed instanceof Error ? displayed : error;
}
