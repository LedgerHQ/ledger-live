import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";

import { getSwapAPIBaseURL } from "../../index";
import { fetchCurrencyTo } from "../../api/v5";
import { useAPI } from "../../../../hooks/useAPI";
import { useFeature } from "../../../../featureFlags";
import { useFilteredProviders } from "./useFilteredProviders";
import { FETCH_CURRENCIES_TIMEOUT_MS } from "./constants";

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
      baseUrl: getSwapAPIBaseURL(),
      currencyFromId,
      providers,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
    },
    // BE caches this so less of a problem when FE fetches frequently
    staleTimeout: FETCH_CURRENCIES_TIMEOUT_MS,
    enabled: !!currencyFromId && !loading && !error,
  });
}
