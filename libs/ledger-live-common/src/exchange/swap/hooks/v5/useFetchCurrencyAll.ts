import { useFeature } from "../../../../featureFlags";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyAll } from "../../api/v5";
import { FETCH_CURRENCIES_TIMEOUT_MS } from "./constants";
import { useFilteredProviders } from "./useFilteredProviders";

export function useFetchCurrencyAll() {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const { providers, error } = useFilteredProviders();

  const { data, ...rest } = useAPI({
    queryFn: fetchCurrencyAll,
    queryProps: {
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
      providers,
    },
    staleTimeout: FETCH_CURRENCIES_TIMEOUT_MS,
    enabled: !error && providers.length > 0,
  });
  return {
    ...rest,
    data: data ?? [],
  };
}
