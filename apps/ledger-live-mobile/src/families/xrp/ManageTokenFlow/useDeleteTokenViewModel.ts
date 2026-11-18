import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { presentBroadcastError } from "@ledgerhq/live-common/flows/send/presentBroadcastError";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type {
  SignTransactionIntent,
  SignTransactionIntentInput,
  SignTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { signTransactionIntentLWMDefinition } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/intentLWMDefinition";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { useDispatch } from "~/context/hooks";
import { broadcastLogger } from "~/datadog";
import { useAccountName } from "~/reducers/wallet";
import { makeOptOutTransaction } from "../utils";

export type InfoStep = "blocked" | "confirm" | "success" | "error";

type Step = InfoStep | "sign" | "closed";

type Signing = Readonly<{
  intent: SignTransactionIntent<SignatureExtraProps>;
  deviceInitializationInput: InitializationInput;
}>;

type Failure = Readonly<{ error: Error; isSigned: boolean }>;

export type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
  onSuccess: () => void;
  onDone: () => void;
}>;

const INFO_STEPS = new Set<Step>(["blocked", "confirm", "success", "error"]);

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
  // The sheet keeps showing its last content while it animates out
  const [infoStep, setInfoStep] = useState<InfoStep>(firstStep);
  const [failure, setFailure] = useState<Failure>();
  const [signing, setSigning] = useState<Signing>();
  // The executor sheet cancels on close and on unmount, with the props of its last render.
  // Once signed, only the broadcast result ends the flow.
  const isCancellableRef = useRef(false);
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
    isCancellableRef.current = next === "sign";
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

    buildDeviceInitializationInput({ appRequest: { account }, flow: FlowName.unknown })
      .then(deviceInitializationInput => {
        const input: SignTransactionIntentInput = { account, transaction, parentAccount: null };
        const intent = createIntent(signTransactionIntentLWMDefinition, input);
        setSigning({ intent, deviceInitializationInput });
      })
      .catch(rejection => showError({ error: toError(rejection), isSigned: false }));
  }, [account, goTo, showError, transaction]);

  const onSigned = useCallback(
    (signedOperation: SignedOperation) => {
      isCancellableRef.current = false;
      broadcast(signedOperation)
        .then(operation => {
          dispatch(
            updateAccountWithUpdater({
              accountId: account.id,
              updater: current => addPendingOperation(current, operation),
            }),
          );
          setSigning(undefined);
          goTo("success");
        })
        .catch(rejection => {
          showError({ error: presentBroadcastError(rejection, account, null), isSigned: true });
        });
    },
    [account, broadcast, dispatch, goTo, showError],
  );

  const onIntentJobStateChanged = useCallback(
    (jobState: SignTransactionIntentJobState) => {
      if (jobState.type === "signed") onSigned(jobState.signedOperation);
    },
    [onSigned],
  );

  const onClose = useCallback(() => setStep("closed"), []);

  // A sheet also reports a close when the flow moves on to the next sheet
  const onInfoSheetClose = useCallback(() => {
    setStep(current => (isInfoStep(current) ? "closed" : current));
  }, []);

  const onInfoSheetHidden = useCallback(() => {
    if (step === "closed") onDone();
  }, [onDone, step]);

  const onUserCancel = useCallback(() => {
    if (isCancellableRef.current) onDone();
  }, [onDone]);

  const analyticsProperties = useMemo(() => {
    return {
      action: "delete",
      currency: account.currency.id,
      tokenType: tokenAccount.token.tokenType,
    };
  }, [account.currency.id, tokenAccount.token.tokenType]);

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
    onUserCancel,
    deleteError: failure?.error,
    isSigned: !!failure?.isSigned,
    token: tokenAccount.token,
    isInfoSheetOpen: isInfoStep(step),
    signing: step === "sign" ? signing : undefined,
    isContinueDisabled: !isTransactionReady || !!statusError,
    isContinueLoading: bridgeTransaction.bridgePending,
    onRetry: onContinue,
  };
}
