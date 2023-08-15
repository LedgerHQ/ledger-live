import { useCallback } from "react";
import { getAvailableProviders } from "../..";
import { fetchCurrencyFrom } from "../../api/v5/fetchCurrencyFrom";

import { useAPI } from "../common/useAPI";

type Props = {
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyFrom({ currencyTo, additionalCoinsFlag }: Props) {
  return useAPI({
    queryFn: fetchCurrencyFrom,
    queryProps: {
      providers: getAvailableProviders(),
      currencyTo,
      additionalCoinsFlag,
    },
  });
}
