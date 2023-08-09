import { useCallback } from "react";
import { getAvailableProviders } from "../..";
import { useAPI } from "../common/useAPI";
import { fetchCurrencyTo } from "../../api/v5";

type Props = {
  currencyFrom: string;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyTo({ currencyFrom, additionalCoinsFlag }: Props) {
  const _fetchCurrencyTo = useCallback(() => {
    return fetchCurrencyTo({
      providers: getAvailableProviders(),
      currencyFrom,
      additionalCoinsFlag,
    });
  }, [currencyFrom, additionalCoinsFlag]);
  return useAPI(_fetchCurrencyTo, true);
}
