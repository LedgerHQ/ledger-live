import { useCallback, useMemo, useReducer } from "react";
import type { Operation } from "@ledgerhq/types-live";
import type { SendFlowOperationResult } from "../types";

type OperationAction =
  | { type: "SET_OPERATION"; operation: Operation }
  | { type: "SET_ERROR"; error: Error }
  | { type: "SET_SIGNED" }
  | { type: "RESET" };

function operationReducer(
  state: SendFlowOperationResult,
  action: OperationAction,
): SendFlowOperationResult {
  switch (action.type) {
    case "SET_OPERATION":
      return { optimisticOperation: action.operation, transactionError: null, signed: true };
    case "SET_ERROR":
      return { ...state, transactionError: action.error, signed: false };
    case "SET_SIGNED":
      return { ...state, signed: true };
    case "RESET":
      return { optimisticOperation: null, transactionError: null, signed: false };
    default:
      return state;
  }
}

function createInitialState(): SendFlowOperationResult {
  return { optimisticOperation: null, transactionError: null, signed: false };
}

type UseSendFlowOperationStateResult = Readonly<{
  state: SendFlowOperationResult;
  actions: Readonly<{
    dispatchSetOperation: (operation: Operation) => void;
    dispatchSetError: (error: Error) => void;
    dispatchSetSigned: () => void;
    dispatchReset: () => void;
  }>;
}>;

/**
 * Pure operation state management without platform-specific side effects
 * Desktop and mobile wrap this with their own side-effects (Redux dispatch)
 */
export function useSendFlowOperationState(): UseSendFlowOperationStateResult {
  const [state, dispatch] = useReducer(operationReducer, undefined, createInitialState);

  const dispatchSetOperation = useCallback((operation: Operation) => {
    dispatch({ type: "SET_OPERATION", operation });
  }, []);

  const dispatchSetError = useCallback((error: Error) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const dispatchSetSigned = useCallback(() => {
    dispatch({ type: "SET_SIGNED" });
  }, []);

  const dispatchReset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const actions = useMemo(
    () => ({
      dispatchSetOperation,
      dispatchSetError,
      dispatchSetSigned,
      dispatchReset,
    }),
    [dispatchSetOperation, dispatchSetError, dispatchSetSigned, dispatchReset],
  );

  return { state, actions };
}
