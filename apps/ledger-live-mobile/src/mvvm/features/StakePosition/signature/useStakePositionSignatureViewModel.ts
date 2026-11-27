import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import type { StakePositionExitAction } from "@features/flow-stake-position";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { interruptionErrorOf } from "@ledgerhq/live-common/hw/actions/interruptionError";
import { useSignAttemptObservability } from "@ledgerhq/live-common/hw/actions/signAttemptObservability";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { buildSignCommonEvent, TransactionPathway } from "@ledgerhq/transaction-observability";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { stakePositionSignatureIntentLWMDefinition } from "./intentLWMDefinition";
import type { StakePositionSignatureExtraProps } from "./types";

export type StakePositionSignatureProps = Readonly<{
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  action: StakePositionExitAction;
  /** False once the signature is handed over: its sheet animates out, then `onDismissed`. */
  isOpen: boolean;
  /** Called once with the signed transaction, which the caller broadcasts. */
  onSigned: (signedOperation: SignedOperation) => void;
  /**
   * The device step could not start. A refusal or a device error is not a failure: the executor
   * shows it, with a retry and a close that calls `onCancel`.
   */
  onFailed: (error: Error) => void;
  /** The user left the device step before the transaction was signed. */
  onCancel: () => void;
  /** The sheet of the device step has left the screen, or never showed. */
  onDismissed: () => void;
}>;

type PinnedSignature = Readonly<{ account: Account; request: SignatureRequest }>;

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

/**
 * Signs the prepared exit through the device intent executor. The request is pinned when the
 * device step opens: an account sync must not restart a signature the device may be showing.
 */
export function useStakePositionSignatureViewModel({
  account,
  transaction,
  status,
  action,
  isOpen,
  onSigned,
  onFailed,
  onCancel,
  onDismissed,
}: StakePositionSignatureProps) {
  const [{ account: signingAccount, request }] = useState<PinnedSignature>(() => ({
    account,
    request: { account, parentAccount: undefined, transaction, status },
  }));
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const signedOperationRef = useRef<SignedOperation | null>(null);
  const hasEndedRef = useRef(false);
  const onFailedRef = useRef(onFailed);
  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

  const fail = useCallback((error: Error) => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    onFailedRef.current(error);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    buildDeviceInitializationInput({
      appRequest: { account: signingAccount },
      flow: FlowName.staking,
    }).then(
      input => {
        if (!isCancelled) setInitializationInput(input);
      },
      (error: unknown) => {
        if (!isCancelled) fail(toError(error));
      },
    );
    return () => {
      isCancelled = true;
    };
  }, [fail, signingAccount]);

  // Closed before the executor showed: no sheet animates out.
  useEffect(() => {
    if (!isOpen && !initializationInput) onDismissed();
  }, [initializationInput, isOpen, onDismissed]);

  const { beginAttempt, failInterruptedAttempt, noteSettled, notePromptShown, resetAttempt } =
    useSignAttemptObservability(
      useCallback(
        () =>
          buildSignCommonEvent({
            account: signingAccount,
            mainAccount: signingAccount,
            pathway: TransactionPathway.Send,
            transaction: request.transaction,
          }),
        [request, signingAccount],
      ),
    );

  const keepSignedOperation = useCallback((signedOperation: SignedOperation) => {
    signedOperationRef.current = signedOperation;
  }, []);

  const intent = useMemo(
    () =>
      createIntent(stakePositionSignatureIntentLWMDefinition, request, {
        onResult: keepSignedOperation,
      }),
    [keepSignedOperation, request],
  );

  // The executor must stay mounted until its job ends, so the signature is handed over then.
  const handOverSignature = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation || hasEndedRef.current) return;
    hasEndedRef.current = true;
    onSigned(signedOperation);
  }, [onSigned]);

  const onIntentJobStateChanged = useCallback(
    (jobState: SignTransactionIntentWithResultJobState) => {
      switch (jobState.type) {
        case "pending":
          beginAttempt();
          return;
        case "device-signature-requested":
          notePromptShown();
          return;
        case "signed":
        case "cancelled":
        case "error":
          noteSettled();
          return;
        default:
          return;
      }
    },
    [beginAttempt, notePromptShown, noteSettled],
  );

  const onExecutorStateChanged = useCallback(
    (executorState: ExecutorState) => {
      if (executorState.type === "executingIntent") {
        setDeviceName(executorState.connectionResult.compatDeviceName);
        return;
      }
      if (executorState.type !== "deviceDisconnected") return;
      // The signature is already in hand: the device is no longer needed to broadcast it.
      if (signedOperationRef.current) {
        handOverSignature();
        return;
      }
      failInterruptedAttempt(interruptionErrorOf(null, undefined));
      resetAttempt();
    },
    [failInterruptedAttempt, handOverSignature, resetAttempt],
  );

  // The sheet reports every close, including the one that follows the end of the signature.
  const onUserCancel = useCallback(() => {
    if (signedOperationRef.current || hasEndedRef.current || !isOpen) return;
    onCancel();
  }, [isOpen, onCancel]);

  const extraProps = useMemo<StakePositionSignatureExtraProps>(
    () => ({ deviceName, action }),
    [action, deviceName],
  );

  return {
    initializationInput,
    intent,
    extraProps,
    isOpen,
    onIntentJobStateChanged,
    onIntentJobComplete: handOverSignature,
    onExecutorStateChanged,
    onUserCancel,
    onDismissed,
  };
}
