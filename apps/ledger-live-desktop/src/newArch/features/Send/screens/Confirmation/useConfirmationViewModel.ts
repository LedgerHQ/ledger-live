import { useCallback, useMemo } from "react";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import type { SendFlowOperationResult } from "../../types";

type ConfirmationStatus = "success" | "refused" | "error" | "idle";

function getConfirmationStatus(operation: SendFlowOperationResult): ConfirmationStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return "success";
  }

  if (!signed && transactionError?.name === "UserRefusedOnDevice") {
    return "refused";
  }

  if (!signed && transactionError) {
    return "error";
  }

  return "idle";
}

export function useConfirmationViewModel() {
  const { close, state, navigation, operation, status: statusActions } = useSendFlowContext();
  const { account, parentAccount } = state.account;

  const status = useMemo(() => getConfirmationStatus(state.operation), [state.operation]);

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation = useMemo(
    () => optimisticOperation?.subOperations?.[0] ?? optimisticOperation ?? null,
    [optimisticOperation],
  );

  const transactionError = state.operation.transactionError;

  const onViewDetails = useCallback(() => {
    close();
    if (account && concernedOperation) {
      setDrawer(OperationDetails, {
        operationId: concernedOperation.id,
        accountId: account.id,
        parentId: parentAccount?.id,
      });
    }
  }, [close, account, concernedOperation, parentAccount]);

  const onRetry = useCallback(() => {
    operation.onRetry();
    statusActions.resetStatus();
    navigation.goToStep("SIGNATURE");
  }, [navigation, operation, statusActions]);

  const onClose = useCallback(() => {
    close();
  }, [close]);

  return {
    status,
    transactionError,
    onViewDetails,
    onRetry,
    onClose,
  };
}
