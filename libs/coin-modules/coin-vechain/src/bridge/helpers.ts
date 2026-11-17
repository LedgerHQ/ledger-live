import { Account } from "@ledgerhq/types-live";

export function isAccountEmpty(
  account: Pick<Account, "subAccounts" | "balance" | "operationsCount">,
) {
  const vtho = account.subAccounts?.[0];
  const checkSubAccounts = vtho !== undefined && !vtho.balance.isZero();
  return account.operationsCount === 0 && account.balance.isZero() && !checkSubAccounts;
}
