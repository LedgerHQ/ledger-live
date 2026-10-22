import type { Account, AccountLike } from "@ledgerhq/types-live";
import { findSubAccountById, getMainAccount } from "@ledgerhq/live-common/account/index";
import { findAccountById, findSubAccountByIdWithFallback } from "~/renderer/utils";
import type { RouteAccount } from "../types";

function findParentAccount(accounts: Account[], parentAccountId: string | undefined) {
  if (!parentAccountId) return undefined;
  return findAccountById(accounts, parentAccountId) ?? undefined;
}

function findRouteAccount(
  accounts: Account[],
  accountId: string | undefined,
  parentAccount: Account | undefined,
): AccountLike | undefined {
  if (!accountId) return undefined;
  if (parentAccount) {
    return (
      findSubAccountByIdWithFallback(parentAccount, accountId, findSubAccountById) ?? undefined
    );
  }
  return findAccountById(accounts, accountId) ?? undefined;
}

export function resolveRouteAccount(
  accounts: Account[],
  accountId: string | undefined,
  parentAccountId: string | undefined,
): RouteAccount {
  const parentAccount = findParentAccount(accounts, parentAccountId);
  const account = findRouteAccount(accounts, accountId, parentAccount);

  return {
    account,
    parentAccount,
    mainAccount: account ? getMainAccount(account, parentAccount) : undefined,
  };
}
