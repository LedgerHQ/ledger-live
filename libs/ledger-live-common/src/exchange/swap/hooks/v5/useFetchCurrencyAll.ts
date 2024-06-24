import { useFeature } from "../../../../featureFlags";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyAll } from "../../api/v5";
import { FETCH_CURRENCIES_TIMEOUT_MS } from "./constants";
import { useFilteredProviders } from "./useFilteredProviders";

export function useFetchCurrencyAll() {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const { providers, loading, error } = useFilteredProviders();

  const { data, ...rest } = useAPI({
    queryFn: fetchCurrencyAll,
    queryProps: {
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
      providers,
    },
    // assume the all currency list for the given props won't change during a users session.
    staleTimeout: FETCH_CURRENCIES_TIMEOUT_MS,
    enabled: !loading && !error,
  });
  return {
    ...rest,
    data: data ?? [],
  };
}
