import { useCallback, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { FLOW_STATUS, type FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep, SendFlowOperationResult } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

function getConfirmationStatus(
  operation: SendFlowOperationResult,
  currency: TokenCurrency | CryptoCurrency | null,
): FlowStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return FLOW_STATUS.SUCCESS;
  }

  if (signed && transactionError && !optimisticOperation) {
    return FLOW_STATUS.ERROR;
  } else if (!signed && transactionError) {
    if (currency && sendFeatures.isUserRefusedTransactionError(currency, transactionError)) {
      return FLOW_STATUS.IDLE;
    }
    return FLOW_STATUS.ERROR;
  }
  return FLOW_STATUS.IDLE;
}

export function useConfirmationViewModel() {
  const { navigation } = useFlowWizard<SendFlowStep>();
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
