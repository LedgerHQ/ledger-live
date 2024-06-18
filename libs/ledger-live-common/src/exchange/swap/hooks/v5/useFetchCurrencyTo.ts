import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";

import { fetchCurrencyTo } from "../../api/v5";
import { useAPI } from "../../../../hooks/useAPI";
import { useFeature } from "../../../../featureFlags";
import { useFilteredProviders } from "./useFilteredProviders";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyTo({ fromCurrencyAccount }: Props) {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const { providers, loading, error } = useFilteredProviders();

  const currencyFromId = fromCurrencyAccount
    ? getAccountCurrency(fromCurrencyAccount).id
    : undefined;

  return useAPI({
    queryFn: fetchCurrencyTo,
    queryProps: {
      currencyFromId,
      providers,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
    },
    staleTimeout: Infinity,
    enabled: !!currencyFromId && !loading && !error,
  });
}
