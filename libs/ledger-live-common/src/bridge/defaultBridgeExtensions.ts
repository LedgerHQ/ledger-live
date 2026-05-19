import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";

export const defaultIsAccountEmpty = (a: AccountLike): boolean => {
  const hasSubAccounts = a.type === "Account" && a.subAccounts?.length;
  return a.operationsCount === 0 && a.balance.isZero() && !hasSubAccounts;
};

export function defaultClearAccount<T extends AccountLike>(
  account: T,
  familyClean?: (account: Account) => void,
): T {
  if (account.type === "TokenAccount") {
    return {
      ...account,
      balanceHistoryCache: emptyHistoryCache,
      operations: [],
      pendingOperations: [],
    };
  }
  const copy: Account = {
    ...(account as unknown as Account),
    balanceHistoryCache: emptyHistoryCache,
    blockHeight: 0,
    lastSyncDate: new Date(0),
    operations: [],
    pendingOperations: [],
    subAccounts:
      (account as unknown as Account).subAccounts?.map(acc => defaultClearAccount(acc, familyClean)) ||
      [],
  };
  familyClean?.(copy);
  delete copy.nfts;
  return copy as T;
}

export const defaultBridgeExtensions: Required<AccountBridgeExtensions> = {
  isAccountEmpty: defaultIsAccountEmpty,
  clearAccount: a => defaultClearAccount(a),
  getStakesCount: () => 0,
  isEditableOperation: () => false,
  isStuckOperation: () => false,
  getStuckAccountAndOperation: () => undefined,
};
