import { useCallback, useRef } from "react";
import {
  acceptLedgerSyncResult,
  commitKeyRingTree,
  type KeyRingSession,
  type KeyRingTreeUpdate,
} from "@features/platform-key-ring";
import type { LedgerSyncResultAcceptance } from "../types";
import { useLedgerSyncDispatch } from "../internals/store";

/**
 * Accepts the results of the add and remove member device intents: stores the key tree unless
 * Ledger Sync was reset since the run started, keeps the last accepted result, and calls
 * `onFirstAccepted` once, since a disconnected run and its retry can both deliver. `accept` keeps
 * its identity.
 *
 * @example
 * ```ts
 * const { resultRef, accept } = useLedgerSyncResultAcceptance<KeyRingActivation>();
 * const onResult = (activation: KeyRingActivation, runSession: KeyRingSession) =>
 *   accept(activation.tree, runSession, activation, () => trackLedgerSyncActivated(properties));
 * ```
 */
export function useLedgerSyncResultAcceptance<R>(): LedgerSyncResultAcceptance<R> {
  const dispatch = useLedgerSyncDispatch();
  const resultRef = useRef<R | null>(null);

  const accept = useCallback(
    (
      tree: KeyRingTreeUpdate,
      runSession: KeyRingSession,
      result: R,
      onFirstAccepted?: () => void,
    ): boolean => {
      const isAccepted = dispatch(acceptLedgerSyncResult(commitKeyRingTree(tree), runSession));
      if (!isAccepted) return false;
      const isFirstResult = resultRef.current === null;
      resultRef.current = result;
      if (isFirstResult) onFirstAccepted?.();
      return true;
    },
    [dispatch],
  );

  return { resultRef, accept };
}
