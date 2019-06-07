// @flow
import type { Account, TokenAccount } from "../types";

export const isAccountEmpty = (a: Account | TokenAccount): boolean =>
  a.operations.length === 0 && a.balance.isZero();

// clear account to a bare minimal version that can be restored via sync
// will preserve the balance to avoid user panic
export function clearAccount<T: Account | TokenAccount>(account: T): T {
  if (account.type === "TokenAccount") {
    return {
      ...account,
      operations: []
    };
  }

  return {
    ...account,
    lastSyncDate: new Date(0),
    operations: [],
    pendingOperations: [],
    tokenAccounts:
      account.tokenAccounts && account.tokenAccounts.map(clearAccount)
  };
}

export function flattenAccounts(
  topAccounts: Account[] | TokenAccount[] | (Account | TokenAccount)[]
): (Account | TokenAccount)[] {
  const accounts = [];
  for (let i = 0; i < topAccounts.length; i++) {
    const account = topAccounts[i];
    accounts.push(account);
    if (account.type === "Account") {
      const tokenAccounts = account.tokenAccounts || [];
      for (let j = 0; j < tokenAccounts.length; j++) {
        accounts.push(tokenAccounts[j]);
      }
    }
  }
  return accounts;
}
