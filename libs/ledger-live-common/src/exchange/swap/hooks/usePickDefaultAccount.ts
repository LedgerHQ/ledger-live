import { useEffect, useMemo } from "react";
import { Pair } from "../types";
import { AccountLike } from "../../../types";
import { useCurrenciesByMarketcap } from "../../../currencies/sortByMarketcap";
import { listCryptoCurrencies, listTokens } from "../../../currencies";
import { getAvailableAccountsById } from "../utils";
import { flattenAccounts, getAccountCurrency } from "../../../account";

type Account = AccountLike & { disabled?: boolean };

// Pick a default source account if none are selected.
export const usePickDefaultAccount = (
  accounts: Account[],
  fromAccount: AccountLike | null | undefined,
  setFromAccount: (account: AccountLike) => void,
  pairs?: Pair[]
): Account[] => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const allCurrencies = useCurrenciesByMarketcap(list);
  const availableAccounts = useMemo(() => {
    const filtered = allCurrencies
      .map(({ id }) =>
        getAvailableAccountsById(id, accounts).filter((account) =>
          account.balance.gt(0)
        )
      )
      .flat(1)
      .filter(Boolean);

    return sortAccountsByStatus(
      pairs ? filterAvailableFromAssets(pairs, filtered) : filtered
    );
  }, [accounts, allCurrencies, pairs]);

  useEffect(() => {
    if (!fromAccount)
      if (availableAccounts[0]) {
        setFromAccount(availableAccounts[0]);
      }
  }, [availableAccounts, setFromAccount, fromAccount]);

  return availableAccounts;
};

function filterAvailableFromAssets(pairs: Pair[], accounts: Account[]) {
  return flattenAccounts(accounts).map((account) => {
    const id = getAccountCurrency(account).id;
    const isAccountAvailable = !!pairs.find((pair) => pair.from === id);
    return { ...account, disabled: !isAccountAvailable };
  });
}

// Put disabled accounts and subaccounts at the bottom of the list while preserving the parent/children position.
export function sortAccountsByStatus(accounts: Account[]): Account[] {
  let activeAccounts: Account[] = [];
  let disabledAccounts: Account[] = [];
  let subAccounts: Account[] = [];
  let disabledSubAccounts: Account[] = [];

  // Traverse the accounts in reverse to check disabled accounts with active subAccounts
  for (let i = accounts.length - 1; i >= 0; i--) {
    const account = accounts[i];

    // Handle Account type first
    if (account.type === "Account") {
      if (account.disabled && !subAccounts.length) {
        // When a disabled account has no active subAccount, add it to the disabledAccounts
        disabledAccounts = [
          account,
          ...disabledSubAccounts,
          ...disabledAccounts,
        ];
      } else {
        // When an account has at least an active subAccount, add it to the activeAccounts
        activeAccounts = [
          account,
          ...subAccounts,
          ...disabledSubAccounts,
          ...activeAccounts,
        ];
      }

      // Clear subAccounts
      subAccounts = [];
      disabledSubAccounts = [];
    } else {
      // Add TokenAccount and ChildAccount to the subAccounts arrays
      if (account.disabled) {
        disabledSubAccounts.unshift(account);
      } else {
        subAccounts.unshift(account);
      }
    }
  }

  return [...activeAccounts, ...disabledAccounts];
}
