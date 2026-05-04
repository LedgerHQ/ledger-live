import { use, useMemo } from "react";
import { getAccountBridge } from ".";
import type { Account, AccountBridge, AccountLike, TransactionCommon } from "@ledgerhq/types-live";

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
): AccountBridge<T> {
  const promise = useMemo(
    () => fulfilledPromise(getAccountBridge(account, parentAccount) as AccountBridge<T>),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.id, parentAccount?.id],
  );
  return use(promise);
}
