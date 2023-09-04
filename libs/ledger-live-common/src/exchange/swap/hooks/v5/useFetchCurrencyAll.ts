import { getAvailableProviders } from "../..";
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyAll } from "../../api/v5";

export function useFetchCurrencyAll() {
  return useAPI({
    queryFn: fetchCurrencyAll,
    queryProps: {
      providers: getAvailableProviders(),
    },
    // assume the all currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
  });
}
