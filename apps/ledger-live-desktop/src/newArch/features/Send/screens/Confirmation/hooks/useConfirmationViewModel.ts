import { useCallback, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { FlowStatus } from "LLD/features/FlowWizard/types";
import type { SendFlowOperationResult } from "../../../types";
import {
  useSendFlowActions,
  useSendFlowData,
  useSendFlowNavigation,
} from "../../../context/SendFlowContext";

function getConfirmationStatus(
  operation: SendFlowOperationResult,
  currency: TokenCurrency | CryptoCurrency | null,
): FlowStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return "success";
  }

  if (signed && transactionError && !optimisticOperation) {
    return "error";
  } else if (!signed && transactionError) {
    if (currency && sendFeatures.isUserRefusedTransactionError(currency, transactionError)) {
      return "idle";
    }
    return "error";
  }
  return "idle";
}

export function useConfirmationViewModel() {
  const { navigation } = useSendFlowNavigation();
  const { close, status: statusActions, operation } = useSendFlowActions();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const status = useMemo(
    () => getConfirmationStatus(state.operation, state.account.currency),
    [state.operation, state.account.currency],
  );

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
