import { useCallback, useRef, useState } from "react";
import { createIntent, type ExecutorState, type Intent } from "@features/platform-device-intent";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import { presentBroadcastError } from "@ledgerhq/live-common/flows/send/presentBroadcastError";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import { signTransactionIntentLWDDefinition } from "LLD/features/Send/screens/Signature/intents/signTransactionIntent/intentLWDDefinition";
import type { SignatureExtraProps } from "LLD/features/Send/screens/Signature/intents/signTransactionIntent/types";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

type Phase = "idle" | "sign" | "broadcasting" | "success" | "error";

type ExecutorInput = Readonly<{
  intent: Intent<
    SignTransactionIntentWithResultJobState,
    SignatureRequest,
    SignatureExtraProps,
    SignedOperation
  >;
  deviceInitializationInput: InitializationInput;
}>;

type Failure = Readonly<{ error: Error; isSigned: boolean }>;

const SIGNATURE_EXTRA_PROPS: SignatureExtraProps = {
  sponsoredTransfer: false,
  onDeviceConfirmationShown: () => {},
};

function toError(rejection: unknown): Error {
  return rejection instanceof Error ? rejection : new Error(String(rejection));
}

export function useSignatureSteps(
  account: Account,
  transaction: Transaction | null | undefined,
  status: TransactionStatus,
) {
  const dispatch = useDispatch();
  const [phase, setPhase] = useState<Phase>("idle");
  const [executorInput, setExecutorInput] = useState<ExecutorInput>();
  const [failure, setFailure] = useState<Failure>();
  const [operation, setOperation] = useState<Operation>();
  const signedOperationRef = useRef<SignedOperation | undefined>(undefined);

  const broadcast = useBroadcast({ account, transaction, parentAccount: undefined });

  const showError = useCallback((next: Failure) => {
    setExecutorInput(undefined);
    setFailure(next);
    setPhase("error");
  }, []);

  const onStart = useCallback(() => {
    if (!transaction) return;

    setPhase("sign");
    buildDeviceInitializationInput({ appRequest: { account }, flow: FlowName.manageAssets })
      .then(deviceInitializationInput => {
        const request: SignatureRequest = {
          account,
          transaction,
          status,
          parentAccount: undefined,
        };
        const intent = createIntent(signTransactionIntentLWDDefinition, request, {
          onResult: signedOperation => {
            signedOperationRef.current = signedOperation;
          },
        });
        setExecutorInput({ intent, deviceInitializationInput });
      })
      .catch(error => showError({ error: toError(error), isSigned: false }));
  }, [account, showError, status, transaction]);

  const onIntentJobComplete = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation) return;

    signedOperationRef.current = undefined;
    setExecutorInput(undefined);
    setPhase("broadcasting");
    broadcast(signedOperation)
      .then(broadcasted => {
        dispatch(
          updateAccountWithUpdater(account.id, storedAccount => {
            return addPendingOperation(storedAccount, broadcasted);
          }),
        );
        setOperation(broadcasted);
        setPhase("success");
      })
      .catch(error => {
        showError({ error: presentBroadcastError(error, account, null), isSigned: true });
      });
  }, [account, broadcast, dispatch, showError]);

  const onExecutorStateChanged = useCallback(
    (executorState: ExecutorState) => {
      if (executorState.type === "deviceDisconnected") onIntentJobComplete();
    },
    [onIntentJobComplete],
  );

  const onReset = useCallback(() => {
    signedOperationRef.current = undefined;
    setExecutorInput(undefined);
    setFailure(undefined);
    setPhase("idle");
  }, []);

  return {
    phase,
    executorInput,
    failure,
    operation,
    onStart,
    onReset,
    onIntentJobComplete,
    onExecutorStateChanged,
    extraProps: SIGNATURE_EXTRA_PROPS,
  };
}

export type SignatureStepsViewModel = ReturnType<typeof useSignatureSteps>;
