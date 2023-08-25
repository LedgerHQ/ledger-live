import { getAvailableProviders } from "../..";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";

import { useAPI } from "../common/useAPI";

type Props = {
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
  enabled?: boolean;
};

export function useFetchCurrencyFrom({ currencyTo, additionalCoinsFlag, enabled }: Props) {
  return useAPI({
    queryFn: fetchCurrencyFrom,
    queryProps: {
      providers: getAvailableProviders(),
      currencyTo,
      additionalCoinsFlag,
    },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
    enabled,
  });
}
