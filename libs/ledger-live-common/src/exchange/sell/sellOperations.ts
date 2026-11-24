import type { Account, Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "../../account/index";

/**
 * Add an operation a sell flow broadcast to its account, so it is never offered for speed up or
 * cancel. It becomes a pending operation right away: until the next sync, that is the only place
 * the Bitcoin guard can see the sell and the unconfirmed transactions it spends from. Token sub
 * operation ids are stored too because token accounts list the sub operation, not the parent one.
 */
export const addSellOperation = (account: Account, operation: Operation): Account => {
  const ids = [operation.id, ...(operation.subOperations ?? []).map(op => op.id)];
  const known = new Set(account.sellOperationIds);
  const newIds = ids.filter(id => !known.has(id));
  if (newIds.length === 0) return account;
  return addPendingOperation(
    { ...account, sellOperationIds: [...(account.sellOperationIds ?? []), ...newIds] },
    operation,
  );
};

export const isSellOperation = (account: Account, operation: Operation): boolean =>
  account.sellOperationIds?.includes(operation.id) ?? false;
