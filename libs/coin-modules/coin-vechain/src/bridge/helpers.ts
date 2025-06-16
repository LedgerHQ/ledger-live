import { Account } from "@ledgerhq/types-live";

export function isAccountEmpty(
  account: Pick<Account, "subAccounts" | "balance" | "operationsCount">,
) {
  const checkSubAccounts = account.subAccounts && !account.subAccounts[0].balance.isZero();
  return account.operationsCount === 0 && account.balance.isZero() && !checkSubAccounts;
}
