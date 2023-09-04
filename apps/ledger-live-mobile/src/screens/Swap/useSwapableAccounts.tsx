import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { useFetchCurrencyFrom } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { flattenAccountsSelector } from "../../reducers/accounts";

export function useSwapableAccounts() {
  const { data: currenciesFrom } = useFetchCurrencyFrom();

  const accounts = useSelector(flattenAccountsSelector);
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
