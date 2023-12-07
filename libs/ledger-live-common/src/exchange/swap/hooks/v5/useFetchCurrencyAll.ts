import { getAvailableProviders } from "../..";
<<<<<<< HEAD
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
=======
import { useFeature } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
import { useAPI } from "../../../../hooks/useAPI";
import { fetchCurrencyAll } from "../../api/v5";

export function useFetchCurrencyAll() {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const { data, ...rest } = useAPI({
    queryFn: fetchCurrencyAll,
    queryProps: {
      providers: getAvailableProviders(),
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
    },
    // assume the all currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
  });
  return {
    ...rest,
    data: data ?? [],
  };
}
