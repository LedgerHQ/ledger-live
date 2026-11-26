import { useCallback, useMemo, useRef, useState } from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { createIntent, type Intent } from "@features/platform-device-intent";
import { track } from "@shared/analytics";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { presentBroadcastError } from "@ledgerhq/live-common/flows/send/presentBroadcastError";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type {
  SignTransactionIntentInput,
  SignTransactionIntentWithResultJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { useDispatch } from "~/context/hooks";
import { broadcastLogger } from "~/datadog";
import { tokenSignatureIntentLWMDefinition } from "../TokenSignatureIntent/intentLWMDefinition";

export type SignInfoStep = "broadcasting" | "success" | "error";

type InfoStep<Extra extends string> = Extra | SignInfoStep;

type Step<Extra extends string> = InfoStep<Extra> | "idle" | "sign" | "closed";

type Signing = Readonly<{
  intent: Intent<
    SignTransactionIntentWithResultJobState,
    SignTransactionIntentInput,
    SignatureExtraProps,
    SignedOperation
  >;
  deviceInitializationInput: InitializationInput;
}>;

type Failure = Readonly<{ error: Error; isSigned: boolean }>;

type Props<Extra extends string> = Readonly<{
  action: "add" | "edit" | "delete";
  account: Account;
  token: TokenCurrency;
  transaction: Transaction | null | undefined;
  initialStep?: Extra;
  onCancel?: () => void;
  onSuccess?: (operation: Operation) => void;
  onExit?: (operation: Operation | undefined) => void;
}>;

export type SignAndBroadcast<Extra extends string = string> = ReturnType<
  typeof useSignAndBroadcast<Extra>
>;

const NON_INFO_STEPS = new Set<string>(["idle", "sign", "closed"]);

const BROADCAST_CONFIG = {
  mevProtected: false,
  source: { type: "coin-module", name: "ledger-live-mobile" },
} as const;

function isInfoStep<Extra extends string>(step: Step<Extra>): step is InfoStep<Extra> {
  return !NON_INFO_STEPS.has(step);
}

function toError(rejection: unknown): Error {
  return rejection instanceof Error ? rejection : new Error(String(rejection));
}

export function useSignAndBroadcast<Extra extends string = never>(props: Props<Extra>) {
  const { action, account, token, transaction } = props;
  const { initialStep = "idle", onCancel, onSuccess, onExit } = props;

  const dispatch = useDispatch();
  const [step, setStep] = useState<Step<Extra>>(initialStep);
  // Sheet callbacks can fire back to back before a re-render, so they read the step from here
  const stepRef = useRef<Step<Extra>>(initialStep);
  // The sheet keeps showing its last content while it animates out
  const [infoStep, setInfoStep] = useState<InfoStep<Extra>>(
    isInfoStep(initialStep) ? initialStep : "broadcasting",
  );
  const [failure, setFailure] = useState<Failure>();
  const [signing, setSigning] = useState<Signing>();
  const signedOperationRef = useRef<SignedOperation | undefined>(undefined);
  const operationRef = useRef<Operation | undefined>(undefined);

  const broadcast = useBroadcast({
    account,
    transaction,
    broadcastConfig: BROADCAST_CONFIG,
    logger: broadcastLogger,
  });

  const goTo = useCallback((next: Step<Extra>) => {
    stepRef.current = next;
    setStep(next);
    if (isInfoStep(next)) setInfoStep(next);
  }, []);

  const showStep = useCallback((next: Extra) => goTo(next), [goTo]);

  const showError = useCallback(
    (next: Failure) => {
      setSigning(undefined);
      setFailure(next);
      goTo("error");
    },
    [goTo],
  );

  const onSign = useCallback(() => {
    if (!transaction || stepRef.current === "sign") return;

    goTo("sign");

    buildDeviceInitializationInput({ appRequest: { account }, flow: FlowName.manageAssets })
      .then(deviceInitializationInput => {
        const input: SignTransactionIntentInput = { account, transaction, parentAccount: null };
        const intent = createIntent(tokenSignatureIntentLWMDefinition, input, {
          onResult: signedOperation => {
            signedOperationRef.current = signedOperation;
          },
        });
        setSigning({ intent, deviceInitializationInput });
      })
      .catch(error => showError({ error: toError(error), isSigned: false }));
  }, [account, goTo, showError, transaction]);

  // Broadcasting unmounts the executor, so it waits for the job to end, as the executor requires.
  // Once idle, a mounted executor would let a disconnect retry and sign the transaction again.
  const onIntentJobComplete = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation) return;

    signedOperationRef.current = undefined;
    goTo("broadcasting");
    broadcast(signedOperation)
      .then(operation => {
        // onSuccess leaves for its own screen before the account update re-renders this one
        if (onSuccess) onSuccess(operation);
        else operationRef.current = operation;
        dispatch(
          updateAccountWithUpdater({
            accountId: account.id,
            updater: current => addPendingOperation(current, operation),
          }),
        );
        goTo(onSuccess ? "closed" : "success");
      })
      .catch(error => {
        showError({ error: presentBroadcastError(error, account, null), isSigned: true });
      });
  }, [account, broadcast, dispatch, goTo, onSuccess, showError]);

  const onClose = useCallback(() => goTo("closed"), [goTo]);

  // A sheet also reports a close when the flow moves on to the next sheet
  const onInfoSheetClose = useCallback(() => {
    if (isInfoStep(stepRef.current)) goTo("closed");
  }, [goTo]);

  const onInfoSheetHidden = useCallback(() => {
    if (stepRef.current !== "closed") return;

    const operation = operationRef.current;
    operationRef.current = undefined;
    onExit?.(operation);
  }, [onExit]);

  // The executor sheet cancels on close and on unmount, with the props of its last render.
  // Once signed, only the broadcast result ends the step.
  const onUserCancel = useCallback(() => {
    if (stepRef.current !== "sign") return;

    setSigning(undefined);
    goTo("idle");
    onCancel?.();
  }, [goTo, onCancel]);

  const analyticsProperties = useMemo(() => {
    return {
      action,
      currency: account.currency.id,
      tokenType: token.tokenType,
    };
  }, [action, account.currency.id, token.tokenType]);

  const onIntentJobStateChanged = useCallback(
    (jobState: SignTransactionIntentWithResultJobState) => {
      if (jobState.type !== "error") return;

      track("error_displayed", {
        ...analyticsProperties,
        step: "signature",
        message_id: jobState.error.name,
        message_type: "error",
      });
    },
    [analyticsProperties],
  );

  return {
    analyticsProperties,
    infoStep,
    showStep,
    onSign,
    onClose,
    onInfoSheetClose,
    onInfoSheetHidden,
    onIntentJobComplete,
    onIntentJobStateChanged,
    onUserCancel,
    signError: failure?.error,
    isSigned: !!failure?.isSigned,
    isSigning: step === "sign",
    isBroadcasting: step === "broadcasting",
    isInfoSheetOpen: isInfoStep(step),
    signing: step === "sign" ? signing : undefined,
  };
}
