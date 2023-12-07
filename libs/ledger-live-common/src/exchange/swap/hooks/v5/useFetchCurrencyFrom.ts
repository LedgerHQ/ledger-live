import { getAvailableProviders } from "../..";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";
import { useAPI } from "../../../../hooks/useAPI";

type Props = {
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
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
