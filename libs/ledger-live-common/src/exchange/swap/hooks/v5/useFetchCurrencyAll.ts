import { useCallback } from "react";
import { getAvailableProviders } from "../..";
import { fetchCurrencyAll } from "../../api/v5/fetchCurrencyAll";

import { useAPI } from "../common/useAPI";

type Props = {
  additionalCoinsFlag: boolean;
};

export function useFetchCurrencyAll({ additionalCoinsFlag }: Props) {
  const _fetchCurrencyAll = useCallback(() => {
    return fetchCurrencyAll({ providers: getAvailableProviders(), additionalCoinsFlag });
  }, [additionalCoinsFlag]);
  return useAPI(_fetchCurrencyAll, true);
}
