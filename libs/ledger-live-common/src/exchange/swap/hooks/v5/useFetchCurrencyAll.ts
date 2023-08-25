import { getAvailableProviders } from "../..";
import { fetchCurrencyAll } from "../../api/v5/fetchCurrencyAll";

import { useAPI } from "../common/useAPI";

type Props = {
  additionalCoinsFlag: boolean;
};

export function useFetchCurrencyAll({ additionalCoinsFlag }: Props) {
  return useAPI({
    queryFn: fetchCurrencyAll,
    queryProps: { providers: getAvailableProviders(), additionalCoinsFlag },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
  });
}
