import { findOperationInAccount } from "@ledgerhq/live-common/operation";
import type { AccountLike, Operation } from "@ledgerhq/types-live";

export function findOperationByIdOrHash(
  account: AccountLike,
  operationId: string,
): Operation | null {
  const operationWithSameId = findOperationInAccount(account, operationId);
  if (operationWithSameId) return operationWithSameId;

  const hash = operationId.split("-").at(-2);
  if (!hash) return null;

  const hasSameHash = (operation: Operation) => operation.hash === hash;
  return (
    account.operations.find(hasSameHash) ?? account.pendingOperations.find(hasSameHash) ?? null
  );
}
