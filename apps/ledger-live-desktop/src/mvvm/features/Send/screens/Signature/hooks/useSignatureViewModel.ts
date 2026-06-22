import { useCallback, useEffect, useMemo, useRef } from "react";
import { trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { selectIsBuyDeviceOpen } from "LLD/features/BuyDevice/buyDeviceDialog";
import { hasOnboardedDeviceSelector, mevProtectionSelector } from "~/renderer/reducers/settings";
import { broadcastLogger } from "~/datadog/logs";

export function useSignatureViewModel() {
  const { navigation } = useFlowWizard();
  const { operation, status, close } = useSendFlowActions();
  const { state } = useSendFlowData();
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

  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount ?? null),
    [account, parentAccount],
  );

  const onDeviceConfirmationShown = useCallback(() => {
    trackPage("Modal send - step device review", null, sendFlowTrackingProperties);
  }, [sendFlowTrackingProperties]);

  const action = useTransactionAction();
  const mevProtected = useSelector(mevProtectionSelector);
  const broadcast = useBroadcast({
    account,
    parentAccount,
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

  const { request, finishWithError, onDeviceActionResult } = useSendFlowSignatureCore({
    account,
    parentAccount,
    transaction,
    status: txStatus,
    currency,
    broadcast,
    operation,
    statusActions: status,
    onFinish: navigation.goToNextStep,
    registerPendingOperation,
  });

  return {
    account,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError,
    onDeviceConfirmationShown,
  };
}
