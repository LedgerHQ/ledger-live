import { useFeature } from "@features/platform-feature-flags";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyAll } from "../../api/v5";
import { FETCH_CURRENCIES_TIMEOUT_MS } from "./constants";
import { useFilteredProviders } from "./useFilteredProviders";

export function useFetchCurrencyAll() {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const { providers, loading: areProvidersLoading, error: providersError } = useFilteredProviders();
  const enabled = !providersError && providers.length > 0;

  const { data, ...rest } = useAPI({
    queryFn: fetchCurrencyAll,
    queryProps: {
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
      providers,
    },
    staleTimeout: FETCH_CURRENCIES_TIMEOUT_MS,
    enabled,
  });
  return {
    ...rest,
    data: data ?? [],
    isResolved:
      data !== undefined || rest.error !== undefined || (!areProvidersLoading && !enabled),
  };
}
