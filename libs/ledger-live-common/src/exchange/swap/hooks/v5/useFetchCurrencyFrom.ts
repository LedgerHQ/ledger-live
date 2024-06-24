import { getSwapAPIBaseURL } from "../../index";
import { useFeature } from "../../../../featureFlags";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";
import { FETCH_CURRENCIES_TIMEOUT_MS } from "./constants";
import { useFilteredProviders } from "./useFilteredProviders";

type Props = {
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
  enabled?: boolean;
};

export function useFetchCurrencyFrom({ currencyTo, enabled }: Props = {}) {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const { providers, loading, error } = useFilteredProviders();

  return useAPI({
    queryFn: fetchCurrencyFrom,
    queryProps: {
      baseUrl: getSwapAPIBaseURL(),
      currencyTo,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
      providers,
    },
    // BE caches this so less of a problem when FE fetches frequently
    staleTimeout: FETCH_CURRENCIES_TIMEOUT_MS,
    enabled: enabled && !loading && !error,
  });
}
