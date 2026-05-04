import type { Account, AccountLike } from "@ledgerhq/types-live";

/** Fresh address used for display and table sorting (token rows use the parent account). */
export function getCryptoTableRowFreshAddress(
  account: AccountLike,
  lookupParentAccount: (id: string) => Account | undefined | null,
): string {
  return account.type === "Account"
    ? account.freshAddress
    : lookupParentAccount(account.parentId)?.freshAddress ?? "";
}
