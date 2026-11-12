import { useCallback, useRef, useState } from "react";
import { track, trackPage } from "@shared/analytics";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignatureDeviceActionResult } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import {
  SEND_FLOW_COMPLETION,
  SEND_FLOW_SOURCE,
  SEND_FLOW_STEP,
  type SendFlowCompletion,
} from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { reportSponsoredTransferOutcome } from "@ledgerhq/live-common/flows/send/sponsored/transferOutcome";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { broadcastLogger } from "~/datadog/logs";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import { getActiveWarningIds } from "../../../utils/messageTracking";

type SendSignatureSessionOptions = Readonly<{
  /**
   * Keeps the first transaction and status for the whole session. A sync that rebuilds them
   * mid-broadcast would otherwise make the signature core drop the broadcast outcome.
   */
  pinTransaction?: boolean;
}>;

type PinnedTransaction = Readonly<{ transaction: Transaction; txStatus: TransactionStatus }>;

/** Signing, broadcast, flow completion and tracking shared by every signature step renderer. */
export function useSendSignatureSession({
  pinTransaction = false,
}: SendSignatureSessionOptions = {}) {
  const { navigation } = useFlowWizard();
  const { operation, status } = useSendFlowActions();
  const { state, source } = useSendFlowData();
  const reduxDispatch = useDispatch();
  const { endSession, flowSessionId, trackMessage } = useSendFlowTracking();

  const liveTransaction = state.transaction.transaction;
  const liveTxStatus = state.transaction.status;
  const [pinned, setPinned] = useState<PinnedTransaction | null>(null);
  if (pinTransaction && pinned === null && liveTransaction) {
    setPinned({ transaction: liveTransaction, txStatus: liveTxStatus });
  }

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = pinTransaction && pinned ? pinned.transaction : liveTransaction;
  const txStatus = pinTransaction && pinned ? pinned.txStatus : liveTxStatus;
  const currency = state.account.currency;

  const hasTrackedDeviceConfirmationRef = useRef(false);
  const confirmationDepsRef = useRef({ account, parentAccount, transaction, txStatus });
  if (
    confirmationDepsRef.current.account !== account ||
    confirmationDepsRef.current.parentAccount !== parentAccount ||
    confirmationDepsRef.current.transaction !== transaction ||
    confirmationDepsRef.current.txStatus !== txStatus
  ) {
    hasTrackedDeviceConfirmationRef.current = false;
    confirmationDepsRef.current = { account, parentAccount, transaction, txStatus };
  }

  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

  const onDeviceConfirmationShown = useCallback(() => {
    trackPage({
      category: "Modal send - step device review",
      props: sendFlowTrackingProperties,
    });
  }, [sendFlowTrackingProperties]);

  const mevProtected = useSelector(mevProtectionSelector);

  const broadcast = useBroadcast({
    account,
    parentAccount,
    transaction,
    broadcastConfig: {
      mevProtected,
      source: {
        type: "coin-module",
        name: "ledger-live-desktop",
        flags: { newSendFlow: true },
      },
    },
    logger: broadcastLogger,
  });

  const registerPendingOperation = useCallback(
    (mainAccount: Account, op: Operation) => {
      reduxDispatch(updateAccountWithUpdater(mainAccount.id, acc => addPendingOperation(acc, op)));
    },
    [reduxDispatch],
  );

  const { state: sponsoredState, actions: sponsoredActions } = useSponsoredSend();
  const isSponsoredTransfer = sponsoredState.phase === SPONSORED_PHASE.TRANSFER;
  const [signedPaymentTxId] = useState(sponsoredState.paymentTxId);

  const onFinish = useCallback(
    (completion: SendFlowCompletion, error?: Error) => {
      if (isSponsoredTransfer) {
        reportSponsoredTransferOutcome({
          actions: sponsoredActions,
          signedPaymentTxId,
          completion,
          error,
        });
        // useSponsoredPhaseNavigator routes FAILED to SPONSORED_FAILURE; don't advance here.
        if (completion !== SEND_FLOW_COMPLETION.SUCCESS) return;
      }
      if (completion === SEND_FLOW_COMPLETION.SUCCESS && source === SEND_FLOW_SOURCE.PAY) {
        endSession();
        navigation.goToStep(SEND_FLOW_STEP.PAY_SUCCESS);
        return;
      }
      navigation.goToNextStep();
    },
    [endSession, navigation, source, isSponsoredTransfer, sponsoredActions, signedPaymentTxId],
  );

  const {
    request,
    finishWithError,
    onDeviceActionResult: onCoreDeviceActionResult,
  } = useSendFlowSignatureCore({
    account,
    parentAccount,
    transaction,
    status: txStatus,
    currency,
    broadcast,
    operation,
    statusActions: status,
    onFinish,
    registerPendingOperation,
    recipientEnsName: state.recipient?.ensName,
  });

  const onDeviceActionResult = useCallback(
    (result: SignatureDeviceActionResult) => {
      if (
        "signedOperation" in result &&
        result.signedOperation &&
        !hasTrackedDeviceConfirmationRef.current
      ) {
        hasTrackedDeviceConfirmationRef.current = true;
        const activeWarnings = getActiveWarningIds(txStatus);
        track("button_clicked", {
          button: "confirm on device",
          page: "step signature",
          flow_session_id: flowSessionId,
          ...getActiveWarningsTrackingProperties(activeWarnings),
          ...sendFlowTrackingProperties,
        });
      }
      onCoreDeviceActionResult(result);
    },
    [flowSessionId, onCoreDeviceActionResult, sendFlowTrackingProperties, txStatus],
  );

  const trackSignatureMessage = useCallback(
    (messageId: string) => {
      trackMessage({
        account,
        parentAccount,
        step: SEND_FLOW_STEP.SIGNATURE,
        message: { messageId, messageType: "error" },
      });
    },
    [account, parentAccount, trackMessage],
  );

  const onLockedDeviceShown = useCallback(() => {
    trackSignatureMessage("LockedDeviceError");
  }, [trackSignatureMessage]);

  return {
    account,
    parentAccount,
    transaction,
    request,
    isSponsoredTransfer,
    sponsoredActions,
    signedPaymentTxId,
    onDeviceActionResult,
    finishWithError,
    trackSignatureMessage,
    onLockedDeviceShown,
    onDeviceConfirmationShown,
  };
}
