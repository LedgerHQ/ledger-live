import React, { useCallback } from "react";
import { DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { ConfirmationStatus } from "./types";
import { SuccessContent } from "./components/SuccessContent";
import { RefusedContent } from "./components/RefusedContent";
import { ErrorContent } from "./components/ErrorContent";
import { SendFlowOperationResult } from "../../types";

function getConfirmationStatus(operation: SendFlowOperationResult): ConfirmationStatus {
  const { signed, optimisticOperation, transactionError } = operation;

  if (signed && optimisticOperation) {
    return "success";
  }

  if (!signed && transactionError?.name === "TransactionRefusedOnDevice") {
    return "refused";
  }

  if (!signed && transactionError) {
    return "error";
  }

  return "idle";
}

export function ConfirmationScreen() {
  const { close, state, navigation } = useSendFlowContext();
  const { account, parentAccount } = state.account;

  const status = getConfirmationStatus(state.operation);

  const optimisticOperation = state.operation.optimisticOperation;
  const concernedOperation = optimisticOperation?.subOperations?.[0] ?? optimisticOperation ?? null;

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

  return (
    <DialogContent>
      <DialogHeader appearance="compact" onClose={close} className="relative" />
      {status === "success" && <SuccessContent onViewDetails={onViewDetails} onClose={close} />}
      {status === "refused" && (
        <RefusedContent onRetry={() => navigation.goToStep("SIGNATURE")} onClose={close} />
      )}
      {status === "error" && (
        <ErrorContent
          onRetry={() => navigation.goToStep("SIGNATURE")}
          onClose={close}
          message={state.operation.transactionError?.message}
        />
      )}
    </DialogContent>
  );
}
