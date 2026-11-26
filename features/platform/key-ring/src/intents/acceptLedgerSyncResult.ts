import type { KeyRingState } from "@domain/entity-key-ring";
import type { KeyRingSession } from "../types";
import { hasKeyRingMemberKey, isSameKeyRingMember, selectKeyRingSession } from "../state/session";

/**
 * Dispatches `action` unless Ledger Sync was reset since the run started: a reset rotates the
 * member key, so a late result of an older run belongs to a Ledger Sync that is gone. Returns
 * whether it was dispatched. A thunk: dispatch it from the intent's `onResult`.
 *
 * @example
 * ```ts
 * onResult: activation => {
 *   const isAccepted = dispatch(
 *     acceptLedgerSyncResult(commitKeyRingTree(activation.tree), runSession),
 *   );
 *   if (isAccepted) track("LedgerSyncActivated");
 * },
 * ```
 */
export function acceptLedgerSyncResult<A>(action: A, runSession: KeyRingSession) {
  return function accept(
    dispatch: (action: A) => unknown,
    getState: () => KeyRingRootState,
  ): boolean {
    // A run without a member key belongs to no Ledger Sync: never accept it.
    if (!hasKeyRingMemberKey(runSession)) return false;
    if (!isSameKeyRingMember(selectKeyRingSession(getState()), runSession)) return false;
    dispatch(action);
    return true;
  };
}

type KeyRingRootState = Readonly<{ trustchain: KeyRingState }>;
