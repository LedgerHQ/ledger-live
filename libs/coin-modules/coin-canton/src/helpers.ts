import type { AccountLike } from "@ledgerhq/types-live";
import { isCantonAccount } from "./bridge/serialization";
import { CantonAccount } from "./types";

export function isCantonAccountEmpty(
  account: Pick<CantonAccount, "operationsCount" | "balance" | "subAccounts" | "cantonResources">,
): boolean {
  return (
    account.operationsCount === 0 &&
    account.balance.isZero() &&
    !account.subAccounts?.length &&
    !account.cantonResources?.pendingTransferProposals?.length
  );
}

/**
 * Check if a Canton account is empty (has no operations, no balance, and no pending transfer proposals)
 * @param account - The account to check (must be a Canton account)
 * @returns true if the account is empty, false otherwise
 */
export function isAccountEmpty(account: AccountLike): boolean {
  if (account.type !== "Account") {
    return false;
  }

  if (!isCantonAccount(account)) {
    return false;
  }

  return isCantonAccountEmpty(account);
}
