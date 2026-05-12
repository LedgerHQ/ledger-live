import { use, useMemo } from "react";
import { getAccountBridge } from ".";
import type {
  Account,
  AccountLike,
  ResolvedAccountBridge,
  TransactionCommon,
} from "@ledgerhq/types-live";

// Temporary: getAccountBridge is currently synchronous but will become async soon.
// Pre-annotate the Promise as fulfilled so React's use() returns it on the first
// render without suspending. Once getAccountBridge is truly async, remove
// fulfilledPromise and return a plain Promise — use() will suspend once, handled
// by the screenLayout <Suspense> boundary.
function fulfilledPromise<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status: "fulfilled"; value: T };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

// Requires a <Suspense> boundary in the parent tree.
export function useAccountBridge<T extends TransactionCommon>(
  account: AccountLike,
  parentAccount?: Account | null,
): ResolvedAccountBridge<T> {
  const promise = useMemo(
    () => fulfilledPromise(getAccountBridge(account, parentAccount) as ResolvedAccountBridge<T>),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.id, parentAccount?.id],
  );
  return use(promise);
}

// Null-safe variant: returns null when account is null.
export function useAccountBridgeOrNull<T extends TransactionCommon>(
  account: AccountLike | null,
  parentAccount?: Account | null,
): ResolvedAccountBridge<T> | null {
  if (!account) return null;
  return getAccountBridge(account, parentAccount) as ResolvedAccountBridge<T>;
}

// Multi-account variant. Today getAccountBridge is sync so we map it directly.
// Once getAccountBridge becomes async, this hook should become
// `accounts.map(a => useAccountBridge(a))` — React's `use()` (called inside useAccountBridge)
// is explicitly allowed in loops: "Unlike all other React Hooks, use can be called within
// loops and conditional statements like if." — https://react.dev/reference/react/use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAccountBridgeMany(accounts: Account[]): ResolvedAccountBridge<any>[] {
  return accounts.map(a => getAccountBridge(a));
}
