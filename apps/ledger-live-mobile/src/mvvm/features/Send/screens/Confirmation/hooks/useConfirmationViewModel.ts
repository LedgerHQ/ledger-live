import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import useExportLogs from "~/components/useExportLogs";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../../types";

export function useConfirmationViewModel() {
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const { close, status: statusActions, operation } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const onSaveLogs = useExportLogs();

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation =
    optimisticOperation?.subOperations?.find(op => op.accountId === account?.id) ??
    optimisticOperation ??
    null;

  const onViewTransaction = useCallback(() => {
    if (!account || !concernedOperation) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount?.id ?? undefined,
      operation: concernedOperation,
    });
  }, [account, parentAccount, concernedOperation, navigation]);

  const onRetry = useCallback(() => {
    navigation.replace(ScreenName.SendFlowSignature);
    operation.onRetry();
    statusActions.resetStatus();
  }, [navigation, operation, statusActions]);

  return {
    status: state.flowStatus,
    transactionError: state.operation.transactionError,
    canViewTransaction: Boolean(account && concernedOperation),
    onViewTransaction,
    onSaveLogs,
    onRetry,
    onClose: close,
  };
}
