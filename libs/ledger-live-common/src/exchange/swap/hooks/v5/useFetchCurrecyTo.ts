import { getAvailableProviders } from "../..";
import { useAPI } from "../common/useAPI";
import { fetchCurrencyTo } from "../../api/v5";

type Props = {
  currencyFrom: string;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyTo({ currencyFrom, additionalCoinsFlag }: Props) {
  return useAPI({
    queryFn: fetchCurrencyTo,
    queryProps: {
      providers: getAvailableProviders(),
      currencyFrom,
      additionalCoinsFlag,
    },
  });
}
