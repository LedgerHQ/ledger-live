import { useEffect, useMemo, useRef } from "react";
import debounce from "lodash/debounce";
import type { Account } from "@ledgerhq/types-live";

/**
 * This function returns true if the acccounts with funds changed between the accounts and the oldAccounts properties.
 * Meaning that at least one account with a positive balance has been added, removed, the balance of an existing empty
 * account is now positive or the balance of an existing account was positive and is now 0.
 * Else this function returns false.
 */
export function hasAccountsWithFundsChanged(accounts: Account[], oldAccounts: Account[]): boolean {
  for (const account of accounts) {
    const matchingOldAccount = oldAccounts.find(acc => acc.id === account.id);

    // Means that account has been added
    if (!matchingOldAccount) {
      if (account.balance.isGreaterThan(0)) {
        return true;
      } else {
        continue;
      }
    }

    // Means that account has been modified
    const hasAccountBeenEmptied =
      account?.balance.isZero() && matchingOldAccount?.balance.isGreaterThan(0);
    const hasAccountReceivedFunds =
      account?.balance.isGreaterThan(0) && matchingOldAccount?.balance.isZero();

    if (hasAccountBeenEmptied || hasAccountReceivedFunds) {
      return true;
    }
  }

  for (const oldAccount of oldAccounts) {
    const matchingAccount = accounts.find(acc => acc.id === oldAccount.id);

    // Means that oldAccount has been deleted
    if (!matchingAccount) {
      if (oldAccount.balance.isGreaterThan(0)) {
        return true;
      } else {
        continue;
      }
    }
  }
  return false;
}

/**
 * Watches for changes in the accounts with funds (see comment on the function above for more details) and it triggers
 * the callback function when a change occurs.
 */
function useAccountsWithFundsListener(
  accounts: Account[],
  callback: () => void,
  debounceTimer: number = 3000,
) {
  const oldAccounts = useRef<Account[]>([]);

  const debouncedUseEffect = useMemo(
    () =>
      debounce(() => {
        if (hasAccountsWithFundsChanged(accounts, oldAccounts.current)) {
          callback();
        }
        oldAccounts.current = accounts;
      }, debounceTimer),
    [accounts],
  );

  useEffect(debouncedUseEffect, [debouncedUseEffect]);
}

export default useAccountsWithFundsListener;
