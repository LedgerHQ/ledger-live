import { useEffect } from "react";
import { Account, TokenAccount } from "../../../types";
import { useCurrenciesByMarketcap } from "../../../currencies/sortByMarketcap";
import { listCryptoCurrencies, listTokens } from "../../../currencies";
import { getAccountCurrency } from "../../../account";

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
          accounts
            .filter(
              (acc) =>
                getAccountCurrency(acc)?.id === id &&
                acc.balance.gt(0) &&
                !acc.disabled
            )
            .sort((a, b) => b.balance.minus(a.balance).toNumber())
        )
        .flat(1)
        .find(Boolean);

      if (defaultAccount) setFromAccount(defaultAccount);
    }
  }, [accounts, allCurrencies, fromAccount, setFromAccount]);
};
