import { useCallback, useEffect, useRef } from "react";
import { log } from "@ledgerhq/logs";
import {
  buildTransactionAbandonedEvent,
  buildTransactionFailureEvent,
  emitTransactionEvent,
  TransactionStage,
  type CommonLogEvent,
} from "@ledgerhq/transaction-observability";

export type SignAttemptObservability = {
  /** Snapshots the attribution and opens a new attempt, so the drop-off can be reported later. */
  beginAttempt: () => void;
  /** The signing surface went away without confirming or erroring. */
  abandonAttempt: () => void;
  /** The device was taken away or swapped, which is not the user dismissing anything. */
  failInterruptedAttempt: (interruptionError: Error) => void;
  /** Forgets the attempt, so what follows is never reported as a dismissal. */
  resetAttempt: () => void;
  notePromptShown: () => void;
  noteSettled: () => void;
  isSettled: () => boolean;
};

/**
 * The sign-attempt drop-off, shared by the structured and raw device actions. Failures and
 * broadcast outcomes are captured wide at the bridge seam, but a user closing the modal is an
 * unsubscribe rather than an error, so the bridge cannot see it — only this layer can.
 *
 * Attribution is snapshotted when the attempt opens: it has to survive the account or
 * transaction changing underneath, and building it must never throw into an unmount.
 */
export function useSignAttemptObservability(
  buildCommon: () => CommonLogEvent,
): SignAttemptObservability {
  const buildCommonRef = useRef(buildCommon);
  buildCommonRef.current = buildCommon;

  const startedRef = useRef(false);
  const promptShownRef = useRef(false);
  const settledRef = useRef(false);
  const commonRef = useRef<CommonLogEvent | null>(null);

  const beginAttempt = useCallback(() => {
    startedRef.current = true;
    promptShownRef.current = false;
    settledRef.current = false;
    try {
      commonRef.current = buildCommonRef.current();
    } catch (error) {
      commonRef.current = null;
      log("tx-observability", "Failed to build sign event", {
        errorName: error instanceof Error ? error.name : "Unknown",
      });
    }
  }, []);

  const resetAttempt = useCallback(() => {
    startedRef.current = false;
    promptShownRef.current = false;
    settledRef.current = false;
    commonRef.current = null;
  }, []);

  const notePromptShown = useCallback(() => {
    promptShownRef.current = true;
  }, []);

  const noteSettled = useCallback(() => {
    settledRef.current = true;
  }, []);

  const isSettled = useCallback(() => settledRef.current, []);

  /** Closes the attempt and hands back the attribution, or nothing when there is none to close. */
  const settleAttempt = useCallback((): CommonLogEvent | null => {
    if (!startedRef.current || settledRef.current) return null;

    settledRef.current = true;
    return commonRef.current;
  }, []);

  const abandonAttempt = useCallback(() => {
    const common = settleAttempt();
    if (!common) return;

    emitTransactionEvent(
      buildTransactionAbandonedEvent(common, { operationalOnly: !promptShownRef.current }),
    );
  }, [settleAttempt]);

  const failInterruptedAttempt = useCallback(
    (interruptionError: Error) => {
      const common = settleAttempt();
      if (!common) return;

      emitTransactionEvent({
        ...buildTransactionFailureEvent(common, {
          stage: TransactionStage.Sign,
          error: interruptionError,
        }),
        operationalOnly: true,
      });
    },
    [settleAttempt],
  );

  useEffect(() => () => abandonAttempt(), [abandonAttempt]);

  return {
    abandonAttempt,
    beginAttempt,
    failInterruptedAttempt,
    isSettled,
    noteSettled,
    notePromptShown,
    resetAttempt,
  };
}
