import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import useExportLogs from "~/components/useExportLogs";
import { screen } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import type { SendFlowNavigationProp } from "../../../types";

export function useConfirmationViewModel() {
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { close, status: statusActions, operation } = useSendFlowActions();
  const { startSigning } = useSendSignature();
  const { state } = useSendFlowData();
  const { recipientType, savedContactDuringFlow } = useSendFlowTracking();
  const { account, parentAccount } = state.account;
  const onSaveLogs = useExportLogs();
  const trackingProperties = useMemo(
    () => ({
      ...getSendFlowTrackingProperties(account, parentAccount),
      recipientType,
    }),
    [account, parentAccount, recipientType],
  );

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation =
    optimisticOperation?.subOperations?.find(op => op.accountId === account?.id) ??
    optimisticOperation ??
    null;

  useEffect(() => {
    if (state.flowStatus === FLOW_STATUS.SUCCESS) {
      void screen("Modal send - transaction sent", undefined, {
        ...trackingProperties,
        savedContactDuringFlow,
      });
    }
  }, [savedContactDuringFlow, state.flowStatus, trackingProperties]);

  const onViewTransaction = useCallback(() => {
    if (!account || !concernedOperation) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id ?? undefined,
      operation: concernedOperation,
    });
  }, [account, parentAccount, concernedOperation, navigation]);

  const onRetry = useCallback(() => {
    operation.onRetry();
    statusActions.resetStatus();
    startSigning();
  }, [operation, statusActions, startSigning]);

  return {
    status: state.flowStatus,
    transactionError: state.operation.transactionError,
    canViewTransaction: Boolean(account && concernedOperation),
    trackingProperties,
    onViewTransaction,
    onSaveLogs,
    onRetry,
    onClose: close,
  };
}
