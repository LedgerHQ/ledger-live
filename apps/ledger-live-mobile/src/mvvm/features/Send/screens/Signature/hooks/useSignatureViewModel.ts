import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent } from "@ledgerhq/device-intent";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { useDispatch, useSelector } from "~/context/hooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { mevProtectionSelector } from "~/reducers/settings";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { broadcastLogger } from "~/datadog";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { signTransactionIntentLWMDefinition } from "../intents/signTransactionIntent/intentLWMDefinition";

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useSignatureViewModel() {
  const { operation, status } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { finishSigning, stopSigning } = useSendSignature();
  const reduxDispatch = useDispatch();

  const { account, parentAccount, currency } = state.account;
  const transaction = state.transaction.transaction;
  const txStatus = state.transaction.status;

  const mevProtected = useSelector(mevProtectionSelector);
  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  const [isSigningCompleted, setIsSigningCompleted] = useState(false);
  const isSigningCompletedRef = useRef(false);

  const broadcast = useBroadcast({
    account,
    parentAccount,
    transaction,
    broadcastConfig: {
      mevProtected,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: true } },
    },
    logger: broadcastLogger,
  });

  const registerPendingOperation = useCallback(
    (mainAccount: Account, op: Operation) => {
      reduxDispatch(
        updateAccountWithUpdater({
          accountId: mainAccount.id,
          updater: acc => addPendingOperation(acc, op),
        }),
      );
    },
    [reduxDispatch],
  );

  const goToConfirmation = useCallback(() => {
    // Dismisses the overlay and runs the onComplete callback registered by the triggering screen
    // (Amount or CoinControl). That callback holds the navigation reference to navigate to
    // Confirmation from within the FlowStackNavigator's React subtree.
    finishSigning();
  }, [finishSigning]);

  const { request, finishWithError, onDeviceActionResult } = useSendFlowSignatureCore({
    account,
    parentAccount,
    transaction,
    status: txStatus,
    currency,
    broadcast,
    operation,
    statusActions: status,
    onFinish: goToConfirmation,
    registerPendingOperation,
  });

  useEffect(() => {
    if (!request) {
      isSigningCompletedRef.current = false;
      setIsSigningCompleted(false);
      setDeviceInitializationInput(null);
      return;
    }

    let cancelled = false;
    isSigningCompletedRef.current = false;
    setIsSigningCompleted(false);
    setDeviceInitializationInput(null);

    const mainAccount = getMainAccount(request.account, request.parentAccount ?? undefined);

    buildDeviceInitializationInput({
      appRequest: {
        account: mainAccount,
        tokenCurrency: request.tokenCurrency ?? undefined,
      },
      flow: FlowName.send,
    })
      .then(input => {
        if (!cancelled) {
          setDeviceInitializationInput(input);
        }
      })
      .catch(error => {
        if (!cancelled) {
          finishWithError(normalizeError(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [finishWithError, request]);

  const signatureIntent = useMemo(
    () => (request ? createIntent(signTransactionIntentLWMDefinition, request) : null),
    [request],
  );

  const onIntentJobStateChanged = useCallback(
    (jobState: SignTransactionIntentJobState) => {
      if (jobState.type === "signed") {
        isSigningCompletedRef.current = true;
        setIsSigningCompleted(true);
        onDeviceActionResult({
          signedOperation: jobState.signedOperation,
          // Legacy SignatureDeviceActionResult shape; useSendFlowSignatureCore ignores device.
          device: {},
        });
        return;
      }

      if (jobState.type === "cancelled") {
        isSigningCompletedRef.current = false;
        setIsSigningCompleted(false);
      }
    },
    [onDeviceActionResult],
  );

  // On a signing failure the executor keeps the sheet open and renders its native
  // IntentError screen (Retry / Close). We deliberately do not navigate away here so
  // the user stays on the sheet, as opposed to the success path which broadcasts and
  // moves to the confirmation screen.
  const onIntentJobError = useCallback(() => {}, []);

  // Explicit dismiss of the sheet (close button / backdrop) closes the overlay and leaves the user
  // on the underlying review screen.
  const onUserCancel = useCallback(() => {
    if (isSigningCompletedRef.current) {
      return;
    }
    stopSigning();
  }, [stopSigning]);

  return {
    account,
    transaction,
    request,
    deviceInitializationInput,
    signatureIntent,
    isSigningCompleted,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  };
}
