import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "../reducers/accounts";
import debounce from "lodash/debounce";
import type { Account } from "@ledgerhq/types-live";
import { updateIdentify } from "../analytics/segment";

function hasAccountsWithFundsChanged(accounts: Account[], oldAccounts: Account[]): boolean {
  if (accounts.length !== oldAccounts.length) {
    return true;
  }
  for (const account of accounts) {
    const matchingOldAccount = oldAccounts.find(acc => acc.id === account.id);
    if (!matchingOldAccount) continue;

    const hasAccountBeenEmptied =
      account?.balance.isZero() && matchingOldAccount?.balance.isGreaterThan(0);
    const hasAccountReceivedFunds =
      account?.balance.isGreaterThan(0) && matchingOldAccount?.balance.isZero();

    if (hasAccountBeenEmptied || hasAccountReceivedFunds) {
      return true;
    }
  }
  return false;
}

function useUpdateUserPropertiesOnAccountsChange() {
  const accounts = useSelector(accountsSelector);
  const oldAccounts = useRef<Account[]>([]);

  const debouncedUseEffect = useMemo(
    () =>
      debounce(() => {
        if (hasAccountsWithFundsChanged(accounts, oldAccounts.current)) {
          updateIdentify();
          console.log("ACCOUNTS CHANGED LLD");
        }
        oldAccounts.current = accounts;
      }, 3000),
    [accounts],
  );

  useEffect(debouncedUseEffect, [debouncedUseEffect]);
}

export default useUpdateUserPropertiesOnAccountsChange;
