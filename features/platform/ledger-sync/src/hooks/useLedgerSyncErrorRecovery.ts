import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import { classifyKeyRingError, resetKeyRingState } from "@features/platform-key-ring";
import { trackLedgerSyncDeactivated } from "../analytics";
import { LedgerSyncMembersUnresolvedError } from "../errors";
import { isLedgerSyncTreeGone } from "../logic/errors";
import type { LedgerSyncErrorRecovery, LedgerSyncErrorRecoveryOptions } from "../types";
import { useLedgerSyncDispatch, useLedgerSyncSelector } from "../internals/store";
import { useRestoreKeyRing } from "./useRestoreKeyRing";

/**
 * Recovers from a key ring error of the members list: `member-removed` and `not-allowed` reset
 * Ledger Sync, `outdated` restores the key tree, and `tree-not-found` resets when the backend lost
 * the key tree of this instance (`isLedgerSyncTreeGone`). With `resetOnUnresolvedMembers`, a
 * members query that resolved no members resets too. A reset stores a new member key, tracks
 * `ledgersync_deactivated`, runs `onReset`, then drops the cached access token.
 *
 * @example
 * ```ts
 * const { handleError } = useLedgerSyncErrorRecovery({
 *   client,
 *   onReset: () => dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize })),
 * });
 * ```
 */
export function useLedgerSyncErrorRecovery({
  client,
  onReset,
  resetOnUnresolvedMembers = false,
  logError,
}: LedgerSyncErrorRecoveryOptions): LedgerSyncErrorRecovery {
  const dispatch = useLedgerSyncDispatch();
  const isKeyRingMember = useLedgerSyncSelector(selectIsKeyRingMember);
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
    if (category === "member-removed" || category === "not-allowed") reset();
    if (category === "outdated") void restoreKeyRing();
    if (isLedgerSyncTreeGone(error, isKeyRingMember)) reset();

    const isUnresolvedMembers = error instanceof LedgerSyncMembersUnresolvedError;
    if (resetOnUnresolvedMembers && isUnresolvedMembers) reset();
  }

  return { handleError };
}
