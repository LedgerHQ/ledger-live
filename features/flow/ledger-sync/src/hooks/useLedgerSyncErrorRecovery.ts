import { classifyKeyRingError, resetKeyRingState } from "@features/platform-key-ring";
import { trackLedgerSyncDeactivated } from "../analytics";
import type { LedgerSyncErrorRecovery, LedgerSyncErrorRecoveryOptions } from "../types";
import { useLedgerSyncDispatch } from "../internals/store";
import { useRestoreKeyRing } from "./useRestoreKeyRing";

/**
 * Recovers from a key ring error of the members list: `member-removed` and `not-allowed` reset
 * Ledger Sync, `outdated` restores the key tree, and a message matching `resetOnMessages` resets.
 * A reset stores a new member key, tracks `ledgersync_deactivated`, runs `onReset`, then drops the
 * cached access token. An error matching both a category and a message resets twice.
 *
 * @example
 * ```ts
 * const { handleError } = useLedgerSyncErrorRecovery({
 *   client,
 *   onReset: () => dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize })),
 *   resetOnMessages: [LedgerSyncErrorMessage.noTrustchain],
 * });
 * ```
 */
export function useLedgerSyncErrorRecovery({
  client,
  onReset,
  resetOnMessages,
  logError,
}: LedgerSyncErrorRecoveryOptions): LedgerSyncErrorRecovery {
  const dispatch = useLedgerSyncDispatch();
  const { refetch: restoreKeyRing } = useRestoreKeyRing(client);

  function reset() {
    dispatch(resetKeyRingState());
    trackLedgerSyncDeactivated();
    onReset();
    client.invalidateAuth();
  }

  function handleError(error: Error) {
    logError?.(error);

    const category = classifyKeyRingError(error);
    if (category === "member-removed") reset();
    if (category === "not-allowed") reset();

    if (category === "outdated") void restoreKeyRing();

    const resetMessage = resetOnMessages.find(message => error.message.includes(message));
    if (resetMessage !== undefined) reset();
  }

  return { handleError };
}
