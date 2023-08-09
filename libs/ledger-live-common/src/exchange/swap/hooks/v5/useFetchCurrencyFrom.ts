import { useCallback } from "react";
import { getAvailableProviders } from "../..";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";

import { useAPI } from "../common/useAPI";

type Props = {
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyFrom({ currencyTo, additionalCoinsFlag }: Props) {
  const _fetchCurrencyFrom = useCallback(() => {
    return fetchCurrencyFrom({
      providers: getAvailableProviders(),
      currencyTo,
      additionalCoinsFlag,
    });
  }, [currencyTo, additionalCoinsFlag]);
  return useAPI(_fetchCurrencyFrom, true);
}
