import { useCallback, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";

/** Signing/broadcast state shared by the Stacks stake and unstake flows. */
export function useStacksFlowState(account: AccountLike | null | undefined) {
  const dispatch = useDispatch();
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const resetFlowState = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (op: Operation) => {
      if (!account) return;
      dispatch(updateAccountWithUpdater(account.id, a => addPendingOperation(a, op)));
      setOptimisticOperation(op);
      setTransactionError(null);
    },
    [account, dispatch],
  );

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") logger.critical(error);
    setTransactionError(error);
  }, []);

  return {
    optimisticOperation,
    transactionError,
    signed,
    setSigned,
    resetFlowState,
    handleOperationBroadcasted,
    handleTransactionError,
  };
}
