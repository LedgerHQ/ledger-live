import { useCallback, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import type { SendFlowOperationResult } from "../../types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import {
  useSendFlowActions,
  useSendFlowData,
  useSendFlowNavigation,
} from "../../context/SendFlowContext";

type ConfirmationStatus = "success" | "refused" | "error" | "idle";

function getConfirmationStatus(
  operation: SendFlowOperationResult,
  currency: TokenCurrency | CryptoCurrency | null,
): ConfirmationStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return "success";
  }

  if (
    !signed &&
    currency &&
    sendFeatures.isUserRefusedTransactionError(currency, transactionError)
  ) {
    return "refused";
  }

  if (!signed && transactionError) {
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
