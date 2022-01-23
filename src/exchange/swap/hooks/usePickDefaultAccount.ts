import { useEffect } from "react";
import { Account, TokenAccount } from "../../../types";
import { useCurrenciesByMarketcap } from "../../../currencies/sortByMarketcap";
import { listCryptoCurrencies, listTokens } from "../../../currencies";
import { getAvailableAccountsById } from "../utils";

// Pick a default source account if none are selected.
export const usePickDefaultAccount = (
  accounts: ((Account | TokenAccount) & { disabled?: boolean })[],
  fromAccount: Account | TokenAccount | null | undefined,
  setFromAccount: (account: Account | TokenAccount) => void
): void => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const allCurrencies = useCurrenciesByMarketcap(list);

  useEffect(() => {
    if (!fromAccount && allCurrencies.length > 0) {
      const defaultAccount: Account | TokenAccount | undefined = allCurrencies
        .map(({ id }) =>
          getAvailableAccountsById(id, accounts).filter((account) =>
            account.balance.gt(0)
          )
        )
        .flat(1)
        .find(Boolean);

      if (defaultAccount) setFromAccount(defaultAccount);
    }
  }, [accounts, allCurrencies, fromAccount, setFromAccount]);
};
