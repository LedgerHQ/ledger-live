import type { Account, AccountLike } from "@ledgerhq/types-live";

/** Address used for display and table sorting (token rows use the parent account). */
export function getCryptoAccountAddress(
  account: AccountLike,
  lookupParentAccount: (id: string) => Account | undefined | null,
): string {
  return account.type === "Account"
    ? account.freshAddress
    : lookupParentAccount(account.parentId)?.freshAddress ?? "";
}
