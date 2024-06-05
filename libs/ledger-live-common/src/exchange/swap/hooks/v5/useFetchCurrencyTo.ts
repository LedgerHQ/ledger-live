import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";

import { fetchCurrencyTo } from "../../api/v5";
import { useAPI } from "../../../../hooks/useAPI";
import { useFeature } from "../../../../featureFlags";
import { getAvailableProviders } from "../../../providers";

type Props = {
  fromCurrencyAccount: AccountLike | undefined;
  additionalCoinsFlag?: boolean;
};

export function useFetchCurrencyTo({ fromCurrencyAccount }: Props) {
  const fetchAdditionalCoins = useFeature("fetchAdditionalCoins");
  const providers = getAvailableProviders();
  const ptxSwapMoonpayProviderFlag = useFeature("ptxSwapMoonpayProvider");

  const providersFiltered = ptxSwapMoonpayProviderFlag?.enabled
    ? providers
    : providers.filter(provider => provider !== "moonpay");

  const currencyFromId = fromCurrencyAccount
    ? getAccountCurrency(fromCurrencyAccount).id
    : undefined;

  return useAPI({
    queryFn: fetchCurrencyTo,
    queryProps: {
      currencyFromId,
      providers: providersFiltered,
      additionalCoinsFlag: fetchAdditionalCoins?.enabled,
    },
    // assume a currency list for the given props won't change during a users session.
    staleTimeout: Infinity,
    enabled: !!currencyFromId,
  });
}
