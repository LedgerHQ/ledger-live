import { GroupedCurrencies, LoadingBasedGroupedCurrencies, LoadingStatus } from "./type";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useMemo, useState } from "react";
import { isCurrencySupported, listSupportedCurrencies, listTokens } from "../currencies";
import { loadCurrenciesByProvider } from "./helper";
import { useAcceptedCurrency } from "../modularDrawer/hooks/useAcceptedCurrency";

// FIXME(LIVE-10505): bad performane & shared utility to move to coin-framework
const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

const initialResult: GroupedCurrencies = {
  sortedCryptoCurrencies: [],
  currenciesByProvider: [],
};

export const useGroupedCurrenciesByProvider = (
  withLoading?: boolean,
): GroupedCurrencies | LoadingBasedGroupedCurrencies => {
  const [result, setResult] = useState(initialResult);
  const isAcceptedCurrency = useAcceptedCurrency();

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.Idle);
  const coinsAndTokensSupported = useMemo(
    () =>
      (listSupportedCurrencies() as CryptoOrTokenCurrency[])
        .concat(listSupportedTokens())
        .filter(isAcceptedCurrency),
    [isAcceptedCurrency],
  );

  // Get mapped assets filtered by supported & sorted currencies, grouped by provider id
  useEffect(() => {
    if (withLoading) {
      setLoadingStatus(LoadingStatus.Idle);
      loadCurrenciesByProvider(coinsAndTokensSupported)
        .then(data => {
          setResult(data);
          setLoadingStatus(LoadingStatus.Success);
        })
        .catch(() => setLoadingStatus(LoadingStatus.Error));
    } else {
      loadCurrenciesByProvider(coinsAndTokensSupported).then(setResult);
    }
  }, [coinsAndTokensSupported, withLoading]);
  return withLoading ? { result, loadingStatus } : result;
};
