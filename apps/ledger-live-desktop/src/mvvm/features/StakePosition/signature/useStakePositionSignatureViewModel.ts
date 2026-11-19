import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
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
} from "LLD/components/DeviceIntentExecutor";
import { stakePositionSignatureIntentLWDDefinition } from "./intentLWDDefinition";
import type { StakePositionSignatureExtraProps } from "./types";

export type StakePositionSignatureProps = Readonly<{
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  /** Called once with the signed transaction, which the caller broadcasts. */
  onSigned: (signedOperation: SignedOperation) => void;
  /** A refusal on the device, or a failure before the transaction is signed. */
  onFailed: (error: Error) => void;
  /** The user left the device step before the transaction was signed. */
  onCancel: () => void;
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
  onSigned,
  onFailed,
  onCancel,
}: StakePositionSignatureProps) {
  const [{ account: signingAccount, request }] = useState<PinnedSignature>(() => ({
    account,
    request: { account, parentAccount: undefined, transaction, status },
  }));
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const signedOperationRef = useRef<SignedOperation | null>(null);
  const isSignedRef = useRef(false);
  const onFailedRef = useRef(onFailed);
  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

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
        if (!isCancelled) onFailedRef.current(toError(error));
      },
    );
    return () => {
      isCancelled = true;
    };
  }, [signingAccount]);

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
      createIntent(stakePositionSignatureIntentLWDDefinition, request, {
        onResult: keepSignedOperation,
      }),
    [keepSignedOperation, request],
  );

  // The executor must stay mounted until its job ends, so the signature is handed over then.
  const handOverSignature = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation || isSignedRef.current) return;
    isSignedRef.current = true;
    onSigned(signedOperation);
  }, [isSignedRef, onSigned, signedOperationRef]);

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
          noteSettled();
          return;
        case "cancelled":
          noteSettled();
          onFailed(new UserRefusedOnDevice());
          return;
        case "error":
          noteSettled();
          onFailed(jobState.error);
          return;
        default:
          return;
      }
    },
    [beginAttempt, notePromptShown, noteSettled, onFailed],
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
    [failInterruptedAttempt, handOverSignature, resetAttempt, signedOperationRef],
  );

  const onUserCancel = useCallback(() => {
    if (signedOperationRef.current) return;
    onCancel();
  }, [onCancel, signedOperationRef]);

  const extraProps = useMemo<StakePositionSignatureExtraProps>(
    () => ({ deviceName }),
    [deviceName],
  );

  return {
    initializationInput,
    intent,
    extraProps,
    onIntentJobStateChanged,
    onIntentJobComplete: handOverSignature,
    onExecutorStateChanged,
    onUserCancel,
  };
}
