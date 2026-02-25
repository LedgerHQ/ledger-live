import { useCallback, useMemo, useState } from "react";
import type { Operation } from "@ledgerhq/types-live";
import type {
  SendFlowOperationResult,
  SendFlowOperationActions,
} from "@ledgerhq/live-common/flows/send/types";

type UseSendFlowOperationResult = Readonly<{
  state: SendFlowOperationResult;
  actions: SendFlowOperationActions;
}>;

/**
 * Hook for managing operation state in Send flow
 * Handles operation broadcast, signing, errors, and retry logic
 */
export function useSendFlowOperation(): UseSendFlowOperationResult {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState<boolean>(false);

  const onOperationBroadcasted = useCallback((operation: Operation) => {
    setOptimisticOperation(operation);
    setTransactionError(null);
    setSigned(true);
  }, []);

  const onTransactionError = useCallback((error: Error) => {
    setTransactionError(error);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const onSigned = useCallback(() => {
    setSigned(true);
    setTransactionError(null);
  }, []);

  const onRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const state: SendFlowOperationResult = useMemo(
    () => ({
      optimisticOperation,
      transactionError,
      signed,
    }),
    [optimisticOperation, transactionError, signed],
  );

  const actions: SendFlowOperationActions = useMemo(
    () => ({
      onOperationBroadcasted,
      onTransactionError,
      onSigned,
      onRetry,
    }),
    [onOperationBroadcasted, onTransactionError, onSigned, onRetry],
  );

  return { state, actions };
}
