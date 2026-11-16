import { useEffect } from "react";
import type { Account, Operation } from "@ledgerhq/types-live";
import { settleStakePosition, type StakePositionExitAction } from "@features/flow-stake-position";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

// The success screen shows before the broadcast adds its optimistic operation to the account:
// past this wait, the live app is answered anyway rather than left waiting.
export const OPERATION_ADDED_WAIT_MS = 5_000;

const holdsOperation = (account: Account | undefined, { id }: Operation) =>
  account !== undefined &&
  (account.pendingOperations.some(operation => operation.id === id) ||
    account.operations.some(operation => operation.id === id));

/**
 * Answers the live app once the account holds the broadcast operation, so the positions it then
 * reloads already reflect the transaction.
 */
export function useSettleOnceOperationAdded({
  requestId,
  action,
  accountId,
  operation,
}: Readonly<{
  requestId: number;
  action: StakePositionExitAction;
  accountId: string;
  operation: Operation;
}>) {
  const isOperationAdded = useSelector(state =>
    holdsOperation(
      accountsSelector(state).find(({ id }) => id === accountId),
      operation,
    ),
  );

  useEffect(() => {
    if (isOperationAdded) settleStakePosition(requestId, action);
  }, [isOperationAdded, requestId, action]);

  useEffect(() => {
    const timer = setTimeout(() => settleStakePosition(requestId, action), OPERATION_ADDED_WAIT_MS);
    return () => clearTimeout(timer);
  }, [requestId, action]);
}
