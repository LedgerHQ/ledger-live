import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ConcordiumAccount, ConcordiumAccountRaw } from "../types";

export function isConcordiumAccount(account: Account): account is ConcordiumAccount {
  return account.currency?.family === "concordium" && "concordiumResources" in account;
}

function isConcordiumAccountRaw(accountRaw: AccountRaw): accountRaw is ConcordiumAccountRaw {
  return "concordiumResources" in accountRaw;
}

/**
 * Copies concordiumResources from Account to AccountRaw.
 *
 * Note: ConcordiumResources contains only primitives (boolean, string, number),
 * so no transformation is needed - the object can be directly assigned.
 */
export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  if (!isConcordiumAccount(account) || !account.concordiumResources) {
    return;
  }

  Object.assign(accountRaw, {
    concordiumResources: account.concordiumResources,
  });
}

/**
 * Copies concordiumResources from AccountRaw to Account.
 *
 * Note: ConcordiumResources contains only primitives (boolean, string, number),
 * so no transformation is needed - the object can be directly assigned.
 */
export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (!isConcordiumAccountRaw(accountRaw) || !accountRaw.concordiumResources) {
    return;
  }

  Object.assign(account, {
    concordiumResources: accountRaw.concordiumResources,
  });
}
