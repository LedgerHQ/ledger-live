import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import { useDebouncedRequireBluetooth } from "~/components/RequiresBLE/hooks/useRequireBluetooth";
import { useDispatch, useSelector } from "~/context/hooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";
import { lastConnectedDeviceSelector, mevProtectionSelector } from "~/reducers/settings";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../../types";

export function useSignatureViewModel() {
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { operation, status } = useSendFlowActions();
  const { state } = useSendFlowData();
  const reduxDispatch = useDispatch();

  const { account, parentAccount, currency } = state.account;
  const transaction = state.transaction.transaction;
  const txStatus = state.transaction.status;

  const action = useTransactionDeviceAction();
  const device = useSelector(lastConnectedDeviceSelector);
  const mevProtected = useSelector(mevProtectionSelector);
  const [isBluetoothDrawerDismissed, setIsBluetoothDrawerDismissed] = useState(false);
  const isBluetoothRequired = Boolean(device && !device.wired);
  const { bluetoothRequirementsState, retryRequestOnIssue, cannotRetryRequest } =
    useDebouncedRequireBluetooth({
      requiredFor: "connecting",
      isHookEnabled: isBluetoothRequired && !isBluetoothDrawerDismissed,
    });
  const hasBluetoothIssue =
    isBluetoothRequired &&
    !isBluetoothDrawerDismissed &&
    bluetoothRequirementsState !== "unknown" &&
    bluetoothRequirementsState !== "all_respected";

  const onBluetoothDrawerClose = useCallback(() => {
    setIsBluetoothDrawerDismissed(true);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig: {
      mevProtected,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: true } },
    },
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
    navigation.replace(ScreenName.SendFlowConfirmation);
  }, [navigation]);

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
  });

  return {
    account,
    transaction,
    device,
    action,
    request,
    onDeviceActionResult,
    bluetooth: {
      hasIssue: hasBluetoothIssue,
      bluetoothRequirementsState,
      retryRequestOnIssue,
      cannotRetryRequest,
      onDrawerClose: onBluetoothDrawerClose,
    },
  };
}
