import { useCallback, useRef, useState } from "react";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import {
  useSendFlowSignatureCore,
  type SignatureDeviceActionResult,
} from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import { useDispatch, useSelector } from "~/context/hooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { mevProtectionSelector } from "~/reducers/settings";
import { broadcastLogger } from "~/datadog";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";

/**
 * DeviceAction-based signature step view model (used when `useDeviceActionSignatureSend` is enabled).
 * Shares business logic with `useSignatureViewModel` via `useSendFlowSignatureCore`; only device orchestration differs.
 */
export function useSignatureDeviceActionViewModel() {
  const { operation, status } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { finishSigning, stopSigning } = useSendSignature();
  const reduxDispatch = useDispatch();

  const { account, parentAccount, currency } = state.account;
  const transaction = state.transaction.transaction;
  const txStatus = state.transaction.status;

  const mevProtected = useSelector(mevProtectionSelector);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const isSigningCompletedRef = useRef(false);

  const action = useTransactionDeviceAction();

  const signatureInputsRef = useRef({ account, parentAccount, transaction, txStatus });
  if (
    signatureInputsRef.current.account !== account ||
    signatureInputsRef.current.parentAccount !== parentAccount ||
    signatureInputsRef.current.transaction !== transaction ||
    signatureInputsRef.current.txStatus !== txStatus
  ) {
    isSigningCompletedRef.current = false;
    signatureInputsRef.current = { account, parentAccount, transaction, txStatus };
  }

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

  const goToConfirmation = useCallback(() => {
    // Dismisses the overlay and runs the onComplete callback registered by the triggering screen
    // (Amount or CoinControl), matching the executor path.
    finishSigning();
  }, [finishSigning]);

  const { request, onDeviceActionResult } = useSendFlowSignatureCore({
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

  // Only the success path advances the flow (broadcast + navigate to confirmation). Signature
  // refusals and device errors keep the sheet open with their own retry/close affordances, exactly
  // like the executor path (which stays on the sheet and never navigates away on failure).
  const onDeviceActionResultCompleted = useCallback(
    (result: SignatureDeviceActionResult) => {
      if (isSigningCompletedRef.current) {
        return;
      }

      if ("signedOperation" in result && result.signedOperation) {
        isSigningCompletedRef.current = true;
        onDeviceActionResult(result);
      }
    },
    [onDeviceActionResult],
  );

  // Explicit dismiss of the sheet (close button / backdrop) closes the overlay and leaves the user
  // on the underlying review screen, unless the signature already completed.
  const onUserCancel = useCallback(() => {
    if (isSigningCompletedRef.current) {
      return;
    }
    stopSigning();
  }, [stopSigning]);

  return {
    account,
    parentAccount,
    transaction,
    request,
    action,
    selectedDevice,
    setSelectedDevice,
    onDeviceActionResultCompleted,
    onUserCancel,
  };
}
