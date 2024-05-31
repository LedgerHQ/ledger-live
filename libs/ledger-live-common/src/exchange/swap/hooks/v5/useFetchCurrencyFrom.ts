import { useFeature } from "../../../../featureFlags";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";
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
      currencyTo,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
      providers,
    },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
    enabled: enabled && !loading && !error,
  });
}
