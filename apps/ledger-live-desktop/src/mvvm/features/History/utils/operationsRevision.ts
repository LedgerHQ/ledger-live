import type { Account, AccountLike } from "@ledgerhq/types-live";

function accountRevision(account: AccountLike): string {
  const latest = account.operations[0];
  const pending = account.pendingOperations[0];
  return `${account.operations.length}:${latest?.id ?? ""}:${account.pendingOperations.length}:${pending?.id ?? ""}`;
}

export function operationsRevision(account: Account): string {
  const subAccounts = account.subAccounts ?? [];
  return [accountRevision(account), ...subAccounts.map(accountRevision)].join("|");
}
