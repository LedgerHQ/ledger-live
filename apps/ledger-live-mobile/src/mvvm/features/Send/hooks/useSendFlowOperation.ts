import { useCallback, useMemo } from "react";
import type { Operation } from "@ledgerhq/types-live";
import { useSendFlowOperationState } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowOperationState";
import type {
  SendFlowOperationResult,
  SendFlowOperationActions,
} from "@ledgerhq/live-common/flows/send/types";

type UseSendFlowOperationResult = Readonly<{
  state: SendFlowOperationResult;
  actions: SendFlowOperationActions;
}>;

/**
 * Mobile-specific operation hook (pure state, no side-effects)
 * Wraps common operation state with mobile-specific behavior if needed
 */
export function useSendFlowOperation(): UseSendFlowOperationResult {
  const { state, actions: stateActions } = useSendFlowOperationState();

  const onOperationBroadcasted = useCallback(
    (operation: Operation) => {
      stateActions.dispatchSetOperation(operation);
    },
    [stateActions],
  );

  const onTransactionError = useCallback(
    (error: Error) => {
      stateActions.dispatchSetError(error);
    },
    [stateActions],
  );

  const onSigned = useCallback(() => {
    stateActions.dispatchSetSigned();
  }, [stateActions]);

  const onRetry = useCallback(() => {
    stateActions.dispatchReset();
  }, [stateActions]);

  const actions: SendFlowOperationActions = useMemo(
    () => ({ onOperationBroadcasted, onTransactionError, onSigned, onRetry }),
    [onOperationBroadcasted, onTransactionError, onSigned, onRetry],
  );

  return { state, actions };
}
