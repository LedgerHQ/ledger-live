import type { Account, Operation } from "@ledgerhq/types-live";

/**
 * Remember that an operation was broadcast by a sell flow, so it is never offered
 * for speed up or cancel. Token sub operation ids are stored too because token
 * accounts list the sub operation, not the parent one.
 */
export const addSellOperation = (account: Account, operation: Operation): Account => {
  const ids = [operation.id, ...(operation.subOperations ?? []).map(op => op.id)];
  const known = new Set(account.sellOperationIds);
  const newIds = ids.filter(id => !known.has(id));
  if (newIds.length === 0) return account;
  return { ...account, sellOperationIds: [...(account.sellOperationIds ?? []), ...newIds] };
};

export const isSellOperation = (account: Account, operation: Operation): boolean =>
  account.sellOperationIds?.includes(operation.id) ?? false;
