import { useCallback, useEffect, useRef, useState } from "react";
import { trackPage } from "@shared/analytics";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import {
  SEND_FLOW_COMPLETION,
  SEND_FLOW_SOURCE,
  SEND_FLOW_STEP,
  type SendFlowCompletion,
} from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { isContractDataDisabledError } from "../../../utils/contractDataError";
import { selectIsBuyDeviceOpen } from "LLD/features/BuyDevice/buyDeviceDialog";
import { hasOnboardedDeviceSelector, mevProtectionSelector } from "~/renderer/reducers/settings";
import { broadcastLogger } from "~/datadog/logs";

export function useSignatureViewModel() {
  const { navigation } = useFlowWizard();
  const { operation, status, close } = useSendFlowActions();
  const { state, source } = useSendFlowData();
  const reduxDispatch = useDispatch();

  const wasBuyDeviceOpenRef = useRef(false);

  const isBuyDeviceOpen = useSelector(selectIsBuyDeviceOpen);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);

  // When BuyDevice intercept modal opens then closes without the user having connected a device,
  // close the Send flow to avoid leaving an empty modal behind
  useEffect(() => {
    if (isBuyDeviceOpen) {
      wasBuyDeviceOpenRef.current = true;
    } else if (wasBuyDeviceOpenRef.current && !hasOnboardedDevice) {
      wasBuyDeviceOpenRef.current = false;
      close();
    }
  }, [isBuyDeviceOpen, hasOnboardedDevice, close]);

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const txStatus = state.transaction.status;
  const currency = state.account.currency;

  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

  const onDeviceConfirmationShown = useCallback(() => {
    trackPage({
      category: "Modal send - step device review",
      props: sendFlowTrackingProperties,
    });
  }, [sendFlowTrackingProperties]);

  const action = useTransactionAction();
  const mevProtected = useSelector(mevProtectionSelector);

  const broadcast = useBroadcast({
    account,
    parentAccount,
    transaction,
    broadcastConfig: {
      mevProtected,
      source: { type: "coin-module", name: "ledger-live-desktop", flags: { newSendFlow: true } },
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
        if (completion === SEND_FLOW_COMPLETION.SUCCESS) {
          sponsoredActions.onTransferSuccess(signedPaymentTxId);
        } else {
          // useSponsoredPhaseNavigator routes FAILED to SPONSORED_FAILURE; don't advance here.
          const failure = error ?? new Error("Sponsored transfer failed");
          if (isContractDataDisabledError(failure)) {
            sponsoredActions.setContractDataFailure(failure, signedPaymentTxId);
          } else {
            sponsoredActions.onTransferError(failure, signedPaymentTxId);
          }
          return;
        }
      }
      if (completion === SEND_FLOW_COMPLETION.SUCCESS && source === SEND_FLOW_SOURCE.PAY) {
        navigation.goToStep(SEND_FLOW_STEP.PAY_SUCCESS);
        return;
      }
      navigation.goToNextStep();
    },
    [navigation, source, isSponsoredTransfer, sponsoredActions, signedPaymentTxId],
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
    onFinish,
    registerPendingOperation,
    recipientEnsName: state.recipient?.ensName,
  });

  return {
    account,
    parentAccount,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError,
    onDeviceConfirmationShown,
  };
}
