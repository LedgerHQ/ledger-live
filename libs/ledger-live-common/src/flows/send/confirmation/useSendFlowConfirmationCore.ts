import { useCallback, useMemo } from "react";
import type { Operation } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FlowStatus, FlowStatusActions } from "../../wizard/types";
import type { SendFlowOperationActions, SendFlowOperationResult } from "../types";
import { getConcernedOperation } from "../utils";
import { getConfirmationStatus } from "./getConfirmationStatus";

export type UseSendFlowConfirmationCoreParams = Readonly<{
  operation: SendFlowOperationResult;
  currency: CryptoOrTokenCurrency | null;
  operationActions: Pick<SendFlowOperationActions, "onRetry">;
  statusActions: Pick<FlowStatusActions, "resetStatus">;
  navigateToSignature: () => void;
}>;

export type UseSendFlowConfirmationCoreResult = Readonly<{
  status: FlowStatus;
  transactionError: Error | null;
  concernedOperation: Operation | null;
  onRetry: () => void;
}>;

export function useSendFlowConfirmationCore({
  operation,
  currency,
  operationActions,
  statusActions,
  navigateToSignature,
}: UseSendFlowConfirmationCoreParams): UseSendFlowConfirmationCoreResult {
  const status = useMemo(() => getConfirmationStatus(operation, currency), [operation, currency]);

  const concernedOperation = useMemo(
    () => getConcernedOperation(operation.optimisticOperation),
    [operation.optimisticOperation],
  );

  const onRetry = useCallback(() => {
    operationActions.onRetry();
    statusActions.resetStatus();
    navigateToSignature();
  }, [operationActions, statusActions, navigateToSignature]);

  return {
    status,
    transactionError: operation.transactionError,
    concernedOperation,
    onRetry,
  };
}
