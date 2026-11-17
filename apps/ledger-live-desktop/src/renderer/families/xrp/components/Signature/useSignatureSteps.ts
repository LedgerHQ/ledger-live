import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import { signTransactionIntentLWDDefinition } from "LLD/features/Send/screens/Signature/intents/signTransactionIntent/intentLWDDefinition";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

type SignaturePhase = "idle" | "sign" | "broadcasting" | "success" | "error";

const SIGNATURE_EXTRA_PROPS = { sponsoredTransfer: false, onDeviceConfirmationShown: () => {} };

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useSignatureSteps(
  account: Account,
  transaction: Transaction | null | undefined,
  status: TransactionStatus,
) {
  const dispatch = useDispatch();
  const [phase, setPhase] = useState<SignaturePhase>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  const signedOperationRef = useRef<SignedOperation | null>(null);

  const broadcast = useBroadcast({ account, transaction, parentAccount: undefined });

  const showError = useCallback((nextError: unknown) => {
    setError(toError(nextError));
    setPhase("error");
  }, []);

  useEffect(() => {
    if (!request) return;

    let cancelled = false;
    buildDeviceInitializationInput({ appRequest: { account }, flow: FlowName.send })
      .then(input => {
        if (!cancelled) setDeviceInitializationInput(input);
      })
      .catch(initError => {
        if (!cancelled) showError(initError);
      });

    return () => {
      cancelled = true;
    };
  }, [account, request, showError]);

  const onStart = useCallback(() => {
    const statusError = Object.values(status.errors)[0];
    if (statusError) {
      showError(statusError);
      return;
    }

    if (!transaction) return;
    setRequest({ account, transaction, status, parentAccount: undefined });
    setPhase("sign");
  }, [account, showError, status, transaction]);

  const onSignedOperation = useCallback((signedOperation: SignedOperation) => {
    signedOperationRef.current = signedOperation;
  }, []);

  const signatureIntent = useMemo(() => {
    if (!request) return null;

    return createIntent(signTransactionIntentLWDDefinition, request, {
      onResult: onSignedOperation,
    });
  }, [request, onSignedOperation]);

  const onIntentJobComplete = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation) return;
    signedOperationRef.current = null;

    setPhase("broadcasting");
    broadcast(signedOperation)
      .then(operation => {
        dispatch(
          updateAccountWithUpdater(account.id, storedAccount => {
            return addPendingOperation(storedAccount, operation);
          }),
        );
        setPhase("success");
      })
      .catch(showError);
  }, [account.id, broadcast, dispatch, showError]);

  const onExecutorStateChanged = useCallback(
    (executorState: ExecutorState) => {
      if (executorState.type === "deviceDisconnected") onIntentJobComplete();
    },
    [onIntentJobComplete],
  );

  const onReset = useCallback(() => {
    signedOperationRef.current = null;
    setRequest(null);
    setDeviceInitializationInput(null);
    setError(null);
    setPhase("idle");
  }, []);

  return {
    phase,
    error,
    request,
    deviceInitializationInput,
    signatureIntent,
    onStart,
    onReset,
    onIntentJobComplete,
    onExecutorStateChanged,
    extraProps: SIGNATURE_EXTRA_PROPS,
  };
}

export type SignatureStepsViewModel = ReturnType<typeof useSignatureSteps>;
