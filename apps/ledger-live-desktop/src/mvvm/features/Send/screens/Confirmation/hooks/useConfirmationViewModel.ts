import { useCallback, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { FLOW_STATUS, type FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import type { SendFlowOperationResult, SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { track, trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";

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
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

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

  useMemo(() => {
    switch (status) {
      case FLOW_STATUS.SUCCESS:
        trackPage("Modal send - transaction sent", null, sendFlowTrackingProperties);
        break;
      case FLOW_STATUS.IDLE:
        trackPage("Modal send - action rejected", null, sendFlowTrackingProperties);
        break;
    }
  }, [status, sendFlowTrackingProperties]);

  const onViewDetails = useCallback(() => {
    close();
    if (account && concernedOperation) {
      track("send_modal", {
        button: "view details",
        page: "step confirmation",
        ...sendFlowTrackingProperties,
      });
      setDrawer(OperationDetails, {
        operationId: concernedOperation.id,
        accountId: account.id,
        parentId: parentAccount?.id,
      });
    }
  }, [close, account, concernedOperation, parentAccount, sendFlowTrackingProperties]);

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
