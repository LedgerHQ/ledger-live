import { use, useMemo } from "react";
import { getAccountBridge } from ".";
import type {
  Account,
  AccountLike,
  ResolvedAccountBridge,
  TransactionCommon,
} from "@ledgerhq/types-live";

// Requires a <Suspense> boundary in the parent tree.
export function useAccountBridge<T extends TransactionCommon>(
  account: AccountLike,
  parentAccount?: Account | null,
): ResolvedAccountBridge<T> {
  return use(getAccountBridge(account, parentAccount) as Promise<ResolvedAccountBridge<T>>);
}

// Null-safe variant: returns null when account is null.
// use() can be called conditionally (unlike regular React hooks).
export function useAccountBridgeOrNull<T extends TransactionCommon>(
  account: AccountLike | null,
  parentAccount?: Account | null,
): ResolvedAccountBridge<T> | null {
  if (!account) return null;
  return use(getAccountBridge(account, parentAccount) as Promise<ResolvedAccountBridge<T>>);
}

// Multi-account variant. use() is allowed in loops and inside useMemo's render-phase callback.
// See https://react.dev/reference/react/use
// Memoize on the (id-derived) shape rather than `accounts` reference: callers that rebuild
// the array each render (e.g. inline `.map().filter()`) still get a stable bridge list as
// long as the account ids haven't changed.
export function useAccountBridgeMany(accounts: Account[]): ResolvedAccountBridge<any>[] {
  const idsKey = accounts.map(a => a.id).join("|");
  return useMemo(
    () => accounts.map(a => use(getAccountBridge(a) as Promise<ResolvedAccountBridge<any>>)),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [idsKey],
  );
}
