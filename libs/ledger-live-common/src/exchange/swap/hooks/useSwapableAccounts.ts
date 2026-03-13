import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useMemo } from "react";
import { AccountLike } from "@ledgerhq/types-live";

import { useFetchCurrencyFrom } from "./v5";

type Props = {
  accounts: AccountLike[];
};

export function useSwapableAccounts({ accounts }: Props) {
  const { data: currenciesFrom } = useFetchCurrencyFrom();

  return useMemo(
    () =>
      accounts.map(account => {
        return {
          ...account,
          disabled: !currenciesFrom?.includes(getAccountCurrency(account).id),
        };
      }),
    [currenciesFrom, accounts],
  );
}
