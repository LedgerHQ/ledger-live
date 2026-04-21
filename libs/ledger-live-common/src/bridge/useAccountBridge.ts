import { use, useMemo } from "react";
import { getAccountBridge } from ".";
import type { Account, AccountBridge, AccountLike, TransactionCommon } from "@ledgerhq/types-live";

// Requires a <Suspense> boundary in the parent tree.
export function useAccountBridge<T extends TransactionCommon>(
  account: AccountLike,
  parentAccount?: Account | null,
): AccountBridge<T> {
  const promise = useMemo(
    async () => await getAccountBridge(account, parentAccount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.id, parentAccount?.id],
  );
  return use(promise);
}
