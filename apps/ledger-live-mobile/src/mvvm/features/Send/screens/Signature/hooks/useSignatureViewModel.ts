import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
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
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { isContractDataDisabledError } from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { reportSponsoredTransferOutcome } from "@ledgerhq/live-common/flows/send/sponsored/transferOutcome";
import {
  SEND_FLOW_COMPLETION,
  type SendFlowCompletion,
} from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { useSignatureTracking } from "./useSignatureTracking";
import { signTransactionIntentLWMDefinition } from "../intents/signTransactionIntent/intentLWMDefinition";

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useSignatureViewModel() {
  const { operation, status } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { finishSigning, stopSigning } = useSendSignature();
  const { state: sponsoredState, actions: sponsoredActions } = useSponsoredSend();
  const reduxDispatch = useDispatch();
  const { trackDeviceConfirmation, trackSignatureError } = useSignatureTracking();

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
      source: {
        type: "coin-module",
        name: "ledger-live-mobile",
        flags: { newSendFlow: true },
      },
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

  const isSponsoredTransfer = sponsoredState.phase === SPONSORED_PHASE.TRANSFER;
  // Pinned at mount, so an outcome reported after a re-craft is dropped as stale.
  const [signedPaymentTxId] = useState(sponsoredState.paymentTxId);
  const handedToSponsoredFlowRef = useRef(false);

  const goToConfirmation = useCallback(
    (completion: SendFlowCompletion, error?: Error) => {
      if (isSponsoredTransfer) {
        reportSponsoredTransferOutcome({
          actions: sponsoredActions,
          signedPaymentTxId,
          completion,
          error,
        });
        // A failure stays in the overlay: SponsoredFlowHost shows it, and Retry resumes at TRANSFER.
        if (completion !== SEND_FLOW_COMPLETION.SUCCESS) {
          handedToSponsoredFlowRef.current = true;
          return;
        }
      }
      // Dismisses the overlay and runs the onComplete callback registered by the triggering screen
      // (Amount or CoinControl). That callback holds the navigation reference to navigate to
      // Confirmation from within the FlowStackNavigator's React subtree.
      finishSigning();
    },
    [finishSigning, isSponsoredTransfer, sponsoredActions, signedPaymentTxId],
  );

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
    recipientEnsName: state.recipient?.ensName,
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
        trackDeviceConfirmation();
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
    [onDeviceActionResult, trackDeviceConfirmation],
  );

  // On a signing failure the executor keeps the sheet open and renders its native
  // IntentError screen (Retry / Close). We deliberately do not navigate away here so
  // the user stays on the sheet, as opposed to the success path which broadcasts and
  // moves to the confirmation screen.
  // Exception: Contract Data disabled during a sponsored TRANSFER routes into the orchestration,
  // so the user gets the dedicated recovery screen.
  const onIntentJobError = useCallback(
    (error: unknown) => {
      trackSignatureError(error);
      if (isSponsoredTransfer && isContractDataDisabledError(error)) {
        handedToSponsoredFlowRef.current = true;
        sponsoredActions.setContractDataFailure(error, signedPaymentTxId);
      }
    },
    [trackSignatureError, isSponsoredTransfer, sponsoredActions, signedPaymentTxId],
  );

  // Explicit dismiss of the sheet (close button / backdrop) closes the overlay and leaves the user
  // on the underlying review screen. The sheet also calls this when it unmounts, so it must not
  // stop signing once the failure screen took over: its Retry reopens TX-C.
  const onUserCancel = useCallback(() => {
    if (isSigningCompletedRef.current || handedToSponsoredFlowRef.current) {
      return;
    }
    stopSigning();
  }, [stopSigning]);

  return {
    account,
    parentAccount,
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
