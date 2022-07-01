import { useEffect, useMemo } from "react";
import { Account, TokenAccount } from "../../../types";
import { useCurrenciesByMarketcap } from "../../../currencies/sortByMarketcap";
import { listCryptoCurrencies, listTokens } from "../../../currencies";
import { getAvailableAccountsById } from "../utils";

// Pick a default source account if none are selected.
export const usePickDefaultAccount = (
  accounts: ((Account | TokenAccount) & { disabled?: boolean })[],
  fromAccount: Account | TokenAccount | null | undefined,
  setFromAccount: (account: Account | TokenAccount) => void
): ((Account | TokenAccount) & { disabled?: boolean })[] => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const allCurrencies = useCurrenciesByMarketcap(list);
  const availableAccounts = useMemo(() => {
    return allCurrencies
      .map(({ id }) =>
        getAvailableAccountsById(id, accounts).filter((account) =>
          account.balance.gt(0)
        )
      )
      .flat(1)
      .filter(Boolean);
  }, [accounts, allCurrencies]);

  useEffect(() => {
    if (!fromAccount)
      if (availableAccounts[0]) {
        setFromAccount(availableAccounts[0]);
      }
  }, [availableAccounts, setFromAccount, fromAccount]);

  return availableAccounts;
};
