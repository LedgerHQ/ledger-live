import { getAvailableProviders } from "../..";
import { useAPI } from "../common/useAPI";
import { fetchRates } from "../../api/v5/fetchRates";
import BigNumber from "bignumber.js";
import { areAllItemsDefined } from "../../utils/areAllItemsDefined";

type Props = {
  currencyFrom: string | undefined;
  currencyTo: string | undefined;
  amountFrom: BigNumber | undefined;
};

export function useFetchRates({ currencyFrom, currencyTo, amountFrom }: Props) {
  return useAPI({
    queryFn: fetchRates,
    queryProps: {
      providers: getAvailableProviders(),
      currencyFrom,
      currencyTo,
      amountFrom,
    },
    enabled: areAllItemsDefined(currencyFrom, currencyTo, amountFrom),
  });
}
