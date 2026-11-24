import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent, type Intent } from "@features/platform-device-intent";
import { track } from "@shared/analytics";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
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
import { useAccountName } from "~/reducers/wallet";
import { makeOptOutTransaction } from "../utils";
import { deleteTokenIntentLWMDefinition } from "./deleteTokenIntent/intentLWMDefinition";

export type InfoStep = "blocked" | "confirm" | "broadcasting" | "success" | "error";

type Step = InfoStep | "sign" | "closed";

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

export type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
  onSuccess: () => void;
  onDone: () => void;
}>;

const INFO_STEPS = new Set<Step>(["blocked", "confirm", "broadcasting", "success", "error"]);

const BROADCAST_CONFIG = {
  mevProtected: false,
  source: { type: "coin-module", name: "ledger-live-mobile" },
} as const;

export const SIGNATURE_EXTRA_PROPS: SignatureExtraProps = { sponsoredTransfer: false };

function isInfoStep(step: Step): step is InfoStep {
  return INFO_STEPS.has(step);
}

function toError(rejection: unknown): Error {
  return rejection instanceof Error ? rejection : new Error(String(rejection));
}

export function useDeleteTokenViewModel(props: Props) {
  const { account, tokenAccount, onSuccess, onDone } = props;

  const dispatch = useDispatch();
  const accountName = useAccountName(account);

  const firstStep = tokenAccount.balance.gt(0) ? "blocked" : "confirm";

  const [step, setStep] = useState<Step>(firstStep);
  // Sheet callbacks can fire back to back before a re-render, so they read the step from here
  const stepRef = useRef<Step>(firstStep);
  // The sheet keeps showing its last content while it animates out
  const [infoStep, setInfoStep] = useState<InfoStep>(firstStep);
  const [failure, setFailure] = useState<Failure>();
  const [signing, setSigning] = useState<Signing>();
  const signedOperationRef = useRef<SignedOperation | undefined>(undefined);
  const bridge = useAccountBridge<Transaction>(account);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return { account, transaction: makeOptOutTransaction(bridge, account, tokenAccount.token) };
  });

  const { transaction, updateAccount, updateTransaction } = bridgeTransaction;
  const bridgeAccount = bridgeTransaction.account;

  useEffect(() => {
    if (bridgeAccount === account) return;

    updateAccount(account);
    updateTransaction(tx => ({ ...tx }));
  }, [account, bridgeAccount, updateAccount, updateTransaction]);

  const broadcast = useBroadcast({
    account,
    transaction,
    broadcastConfig: BROADCAST_CONFIG,
    logger: broadcastLogger,
  });

  const goTo = useCallback((next: Step) => {
    stepRef.current = next;
    setStep(next);
    if (isInfoStep(next)) setInfoStep(next);
  }, []);

  const showError = useCallback(
    (next: Failure) => {
      setSigning(undefined);
      setFailure(next);
      goTo("error");
    },
    [goTo],
  );

  const onContinue = useCallback(() => {
    if (!transaction) return;

    goTo("sign");

    buildDeviceInitializationInput({ appRequest: { account }, flow: FlowName.manageAssets })
      .then(deviceInitializationInput => {
        const input: SignTransactionIntentInput = { account, transaction, parentAccount: null };
        const intent = createIntent(deleteTokenIntentLWMDefinition, input, {
          onResult: signedOperation => {
            signedOperationRef.current = signedOperation;
          },
        });
        setSigning({ intent, deviceInitializationInput });
      })
      .catch(error => showError({ error: toError(error), isSigned: false }));
  }, [account, goTo, showError, transaction]);

  // Broadcasting unmounts the executor, so it waits for the job to end, as the executor requires.
  // Once idle, a mounted executor would let a disconnect retry and sign the removal again.
  const onIntentJobComplete = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation) return;

    signedOperationRef.current = undefined;
    goTo("broadcasting");
    broadcast(signedOperation)
      .then(operation => {
        dispatch(
          updateAccountWithUpdater({
            accountId: account.id,
            updater: current => addPendingOperation(current, operation),
          }),
        );
        goTo("success");
      })
      .catch(error => {
        showError({ error: presentBroadcastError(error, account, null), isSigned: true });
      });
  }, [account, broadcast, dispatch, goTo, showError]);

  const onClose = useCallback(() => goTo("closed"), [goTo]);

  // The confirmation shows refusals and preparation that may have changed since the failure
  const onRetry = useCallback(() => goTo("confirm"), [goTo]);

  // A sheet also reports a close when the flow moves on to the next sheet
  const onInfoSheetClose = useCallback(() => {
    if (isInfoStep(stepRef.current)) goTo("closed");
  }, [goTo]);

  const onInfoSheetHidden = useCallback(() => {
    if (stepRef.current === "closed") onDone();
  }, [onDone]);

  // The executor sheet cancels on close and on unmount, with the props of its last render.
  // Once signed, only the broadcast result ends the flow.
  const onUserCancel = useCallback(() => {
    if (stepRef.current === "sign") onDone();
  }, [onDone]);

  const analyticsProperties = useMemo(() => {
    return {
      action: "delete",
      currency: account.currency.id,
      tokenType: tokenAccount.token.tokenType,
    };
  }, [account.currency.id, tokenAccount.token.tokenType]);

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

  const statusErrors = Object.values(bridgeTransaction.status.errors);
  const statusError = bridgeTransaction.bridgeError ?? statusErrors[0];

  const isTransactionReady = !bridgeTransaction.bridgePending && !!transaction;

  return {
    accountName,
    analyticsProperties,
    infoStep,
    statusError,
    onContinue,
    onClose,
    onSuccess,
    onInfoSheetClose,
    onInfoSheetHidden,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onUserCancel,
    deleteError: failure?.error,
    isSigned: !!failure?.isSigned,
    token: tokenAccount.token,
    isInfoSheetOpen: isInfoStep(step),
    signing: step === "sign" ? signing : undefined,
    isContinueDisabled: !isTransactionReady || !!statusError,
    isContinueLoading: bridgeTransaction.bridgePending,
    onRetry,
  };
}
