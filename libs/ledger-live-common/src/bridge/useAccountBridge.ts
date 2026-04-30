import { use, useMemo } from "react";
import { getAccountBridge } from ".";
import type { Account, AccountBridge, AccountLike, TransactionCommon } from "@ledgerhq/types-live";

// Requires a <Suspense> boundary in the parent tree.
export function useAccountBridge<T extends TransactionCommon>(
  account: AccountLike,
  parentAccount?: Account | null,
): AccountBridge<T> {
  const promise = useMemo(
    () => getAccountBridge(account, parentAccount) as Promise<AccountBridge<T>>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.id, parentAccount?.id],
  );
  return use(promise);
}

// Null-safe variant: returns null when account is null.
// use() can be called conditionally (unlike regular React hooks).
export function useAccountBridgeOrNull<T extends TransactionCommon>(
  account: AccountLike | null,
  parentAccount?: Account | null,
): AccountBridge<T> | null {
  const promise = useMemo(
    () =>
      account
        ? (getAccountBridge(account, parentAccount) as Promise<AccountBridge<T>>)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account?.id, parentAccount?.id],
  );
  if (!promise) return null;
  return use(promise);
}
