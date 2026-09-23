import { useCallback, useEffect, useRef } from "react";
import { track, trackPage } from "~/renderer/analytics/segment";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getActiveWarningsTrackingProperties } from "../../../utils/tracking";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignatureDeviceActionResult } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import {
  SEND_FLOW_COMPLETION,
  SEND_FLOW_SOURCE,
  SEND_FLOW_STEP,
  type SendFlowCompletion,
} from "@ledgerhq/live-common/flows/send/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { selectIsBuyDeviceOpen } from "LLD/features/BuyDevice/buyDeviceDialog";
import { hasOnboardedDeviceSelector, mevProtectionSelector } from "~/renderer/reducers/settings";
import { broadcastLogger } from "~/datadog/logs";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { getActiveWarningIds } from "../../../utils/messageTracking";

export function useSignatureViewModel() {
  const { navigation } = useFlowWizard();
  const { operation, status, close } = useSendFlowActions();
  const { state, source } = useSendFlowData();
  const reduxDispatch = useDispatch();
  const { endSession, flowSessionId, trackMessage } = useSendFlowTracking();

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
    trackPage("Modal send - step device review", null, sendFlowTrackingProperties);
  }, [sendFlowTrackingProperties]);

  const action = useTransactionAction();
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

  const onFinish = useCallback(
    (completion: SendFlowCompletion) => {
      if (completion === SEND_FLOW_COMPLETION.SUCCESS && source === SEND_FLOW_SOURCE.PAY) {
        endSession();
        navigation.goToStep(SEND_FLOW_STEP.PAY_SUCCESS);
        return;
      }
      navigation.goToNextStep();
    },
    [endSession, navigation, source],
  );

  const {
    request,
    finishWithError: finishWithCoreError,
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
      if ("signedOperation" in result && result.signedOperation) {
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

  const onLockedDeviceShown = useCallback(() => {
    trackMessage({
      account,
      parentAccount,
      step: SEND_FLOW_STEP.SIGNATURE,
      message: {
        messageId: "LockedDeviceError",
        messageType: "error",
      },
    });
  }, [account, parentAccount, trackMessage]);

  return {
    account,
    parentAccount,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError: finishWithCoreError,
    onLockedDeviceShown,
    onDeviceConfirmationShown,
  };
}
