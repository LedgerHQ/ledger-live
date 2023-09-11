import { getAvailableProviders } from "../..";
import useFeature from "../../../../featureFlags/useFeature";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";

type Props = {
  currencyTo?: string;
  enabled?: boolean;
};

export function useFetchCurrencyFrom({ currencyTo, enabled }: Props = {}) {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  return useAPI({
    queryFn: fetchCurrencyFrom,
    queryProps: {
      providers: getAvailableProviders(),
      currencyTo,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
    },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
    enabled,
  });
}
