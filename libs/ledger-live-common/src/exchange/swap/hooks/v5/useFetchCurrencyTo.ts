import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";

import { fetchCurrencyTo } from "../../api/v5";
import { getAvailableProviders } from "../..";
import { useAPI } from "../../../../hooks/useAPI";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyTo({ fromCurrencyAccount, additionalCoinsFlag }: Props) {
  const currencyFromId = fromCurrencyAccount
    ? getAccountCurrency(fromCurrencyAccount).id
    : undefined;
  return useAPI({
    queryFn: fetchCurrencyTo,
    queryProps: {
      providers: getAvailableProviders(),
      currencyFromId,
      additionalCoinsFlag,
    },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
    enabled: !!currencyFromId,
  });
}
