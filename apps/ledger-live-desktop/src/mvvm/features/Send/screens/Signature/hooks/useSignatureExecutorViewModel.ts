import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { interruptionErrorOf } from "@ledgerhq/live-common/hw/actions/interruptionError";
import { useSignAttemptObservability } from "@ledgerhq/live-common/hw/actions/signAttemptObservability";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import {
  SEND_FLOW_COMPLETION,
  SEND_FLOW_STEP,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import { reportSponsoredTransferOutcome } from "@ledgerhq/live-common/flows/send/sponsored/transferOutcome";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { buildSignCommonEvent, TransactionPathway } from "@ledgerhq/transaction-observability";
import type { SignedOperation } from "@ledgerhq/types-live";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { signTransactionIntentLWDDefinition } from "../intents/signTransactionIntent/intentLWDDefinition";
import type { SignatureExtraProps } from "../intents/signTransactionIntent/types";
import { useSendSignatureSession } from "./useSendSignatureSession";

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useSignatureExecutorViewModel() {
  const { navigation, stepHistory } = useFlowWizard<SendFlowStep>();
  const {
    account,
    transaction,
    request: liveRequest,
    isSponsoredTransfer,
    sponsoredActions,
    signedPaymentTxId,
    onDeviceActionResult,
    finishWithError,
    trackSignatureMessage,
    onDeviceConfirmationShown,
  } = useSendSignatureSession({ pinTransaction: true });

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  const signedOperationRef = useRef<SignedOperation | null>(null);
  const isSignedRef = useRef(false);
  const [isSigned, setIsSigned] = useState(false);

  // An account sync still rebuilds the request; pinning it keeps the executor from restarting.
  const [request, setRequest] = useState(liveRequest);
  if (request === null && liveRequest !== null) {
    setRequest(liveRequest);
  }
  const finishWithErrorRef = useRef(finishWithError);
  useEffect(() => {
    finishWithErrorRef.current = finishWithError;
  }, [finishWithError]);

  useEffect(() => {
    if (!request) return;

    let cancelled = false;
    const mainAccount = getMainAccount(request.account, request.parentAccount ?? undefined);

    buildDeviceInitializationInput({
      appRequest: {
        account: mainAccount,
        tokenCurrency: request.tokenCurrency ?? undefined,
      },
      flow: FlowName.send,
    })
      .then(input => {
        if (!cancelled) setDeviceInitializationInput(input);
      })
      .catch(error => {
        if (!cancelled) finishWithErrorRef.current(normalizeError(error));
      });

    return () => {
      cancelled = true;
    };
  }, [request]);

  const { beginAttempt, failInterruptedAttempt, noteSettled, notePromptShown, resetAttempt } =
    useSignAttemptObservability(
      useCallback(() => {
        if (!request) throw new Error("No signature request to attribute");
        return buildSignCommonEvent({
          account: request.account,
          mainAccount: getMainAccount(request.account, request.parentAccount ?? undefined),
          pathway: TransactionPathway.Send,
          transaction: request.transaction,
        });
      }, [request]),
    );

  const onSignedOperation = useCallback((signedOperation: SignedOperation) => {
    signedOperationRef.current = signedOperation;
  }, []);

  const signatureIntent = useMemo(
    () =>
      request
        ? createIntent(signTransactionIntentLWDDefinition, request, {
            onResult: onSignedOperation,
          })
        : null,
    [request, onSignedOperation],
  );

  const intentExtraProps = useMemo<SignatureExtraProps>(
    () => ({ sponsoredTransfer: isSponsoredTransfer, onDeviceConfirmationShown }),
    [isSponsoredTransfer, onDeviceConfirmationShown],
  );

  const broadcastSignedOperation = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation || isSignedRef.current) return;
    isSignedRef.current = true;
    setIsSigned(true);
    // useSendFlowSignatureCore ignores `device`; it only keeps the legacy result shape.
    onDeviceActionResult({ signedOperation, device: {} });
  }, [onDeviceActionResult]);

  // Broadcasting unmounts the executor, so it waits for the job to end, as the executor requires.
  const onIntentJobComplete = broadcastSignedOperation;

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
          noteSettled();
          return;
        case "error":
          noteSettled();
          trackSignatureMessage(jobState.error.name);
          return;
        default:
          return;
      }
    },
    [beginAttempt, notePromptShown, noteSettled, trackSignatureMessage],
  );

  const onExecutorStateChanged = useCallback(
    (executorState: ExecutorState) => {
      if (executorState.type !== "deviceDisconnected") return;
      // The signature is already in hand, so the device is no longer needed to broadcast it.
      if (signedOperationRef.current) {
        broadcastSignedOperation();
        return;
      }
      failInterruptedAttempt(interruptionErrorOf(null, undefined));
      // A retry on the disconnected screen opens a fresh attempt, never reported as a dismissal.
      resetAttempt();
    },
    [broadcastSignedOperation, failInterruptedAttempt, resetAttempt],
  );

  const onUserCancel = useCallback(() => {
    if (isSignedRef.current) return;
    if (isSponsoredTransfer) {
      // The rent is already paid: going back to Amount would let Review pay it again.
      reportSponsoredTransferOutcome({
        actions: sponsoredActions,
        signedPaymentTxId,
        completion: SEND_FLOW_COMPLETION.FAILURE,
        error: new UserRefusedOnDevice(),
      });
      return;
    }
    navigation.resetToStep(stepHistory.at(-1) ?? SEND_FLOW_STEP.AMOUNT);
  }, [isSponsoredTransfer, navigation, signedPaymentTxId, sponsoredActions, stepHistory]);

  return {
    account,
    transaction,
    request,
    deviceInitializationInput,
    signatureIntent,
    intentExtraProps,
    isSigned,
    onExecutorStateChanged,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onUserCancel,
  };
}
