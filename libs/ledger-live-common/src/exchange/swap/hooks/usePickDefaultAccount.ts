import { useEffect } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { useCurrenciesByMarketcap } from "../../../currencies/hooks";
import { listCryptoCurrencies, listTokens } from "../../../currencies";
import { getAvailableAccountsById } from "../utils";

// Pick a default source account if none are selected.
export const usePickDefaultAccount = (
  accounts: (AccountLike & { disabled?: boolean })[],
  fromAccount: AccountLike | null | undefined,
  setFromAccount: (account: AccountLike) => void,
): void => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const allCurrencies = useCurrenciesByMarketcap(list);

  useEffect(() => {
    if (!fromAccount && allCurrencies.length > 0) {
      const defaultAccount: AccountLike | undefined = allCurrencies
        .map(({ id }) =>
          getAvailableAccountsById(id, accounts).filter(account => account.balance.gt(0)),
        )
        .flat(1)
        .find(Boolean);

      if (defaultAccount && defaultAccount?.id !== fromAccount?.["id"])
        setFromAccount(defaultAccount);
    }
  }, [accounts, allCurrencies, fromAccount, setFromAccount]);
};
