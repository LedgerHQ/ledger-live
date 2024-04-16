import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";

import { fetchCurrencyTo } from "../../api/v5";
import { getAvailableProviders } from "../..";
import { useAPI } from "../../../../hooks/useAPI";
import { useFeature } from "../../../../featureFlags";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyTo({ fromCurrencyAccount }: Props) {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const currencyFromId = fromCurrencyAccount
    ? getAccountCurrency(fromCurrencyAccount).id
    : undefined;
  return useAPI({
    queryFn: fetchCurrencyTo,
    queryProps: {
      providers: getAvailableProviders(),
      currencyFromId,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
    },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
    enabled: !!currencyFromId,
  });
}
