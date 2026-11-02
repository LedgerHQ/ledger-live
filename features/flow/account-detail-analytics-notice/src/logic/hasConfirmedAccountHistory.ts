import type { AccountHistorySource } from "../types";

export function hasConfirmedAccountHistory<Operation>(
  account: AccountHistorySource<Operation>,
  isConfirmed: (operation: Operation) => boolean,
): boolean {
  return [account, ...(account.subAccounts ?? [])].some(({ operations }) =>
    operations.some(isConfirmed),
  );
}
