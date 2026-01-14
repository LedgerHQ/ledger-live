import { useCallback, useMemo, useReducer } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import logger from "~/renderer/logger";
import type { SendFlowOperationResult, SendFlowOperationActions } from "../types";

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

type UseSendFlowOperationParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
}>;

type UseSendFlowOperationResult = Readonly<{
  state: SendFlowOperationResult;
  actions: SendFlowOperationActions;
}>;

export function useSendFlowOperation({
  account,
  parentAccount,
}: UseSendFlowOperationParams): UseSendFlowOperationResult {
  const reduxDispatch = useDispatch();
  const [state, dispatch] = useReducer(operationReducer, undefined, createInitialState);

  const onOperationBroadcasted = useCallback(
    (operation: Operation) => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);
      reduxDispatch(
        updateAccountWithUpdater(mainAccount.id, acc => addPendingOperation(acc, operation)),
      );
      dispatch({ type: "SET_OPERATION", operation });
    },
    [account, parentAccount, reduxDispatch],
  );

  const onTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const onSigned = useCallback(() => dispatch({ type: "SET_SIGNED" }), []);
  const onRetry = useCallback(() => dispatch({ type: "RESET" }), []);

  const actions: SendFlowOperationActions = useMemo(
    () => ({ onOperationBroadcasted, onTransactionError, onSigned, onRetry }),
    [onOperationBroadcasted, onTransactionError, onSigned, onRetry],
  );

  return { state, actions };
}
