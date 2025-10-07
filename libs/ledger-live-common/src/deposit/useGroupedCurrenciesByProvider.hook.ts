import { GroupedCurrencies, LoadingBasedGroupedCurrencies, LoadingStatus } from "./type";
import { useEffect, useMemo, useState } from "react";
import { listSupportedCurrencies } from "../currencies";
import { loadCurrenciesByProvider } from "./helper";
import { useCurrenciesUnderFeatureFlag } from "../modularDrawer/hooks/useCurrenciesUnderFeatureFlag";

const initialResult: GroupedCurrencies = {
  sortedCryptoCurrencies: [],
  currenciesByProvider: [],
};

export const useGroupedCurrenciesByProvider = (
  withLoading?: boolean,
): GroupedCurrencies | LoadingBasedGroupedCurrencies => {
  const [result, setResult] = useState(initialResult);
  // the import is from MAD but as this hook will be removed, it's fine to keep it here
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.Idle);
  const coinsAndTokensSupported = useMemo(
    () => listSupportedCurrencies().filter(c => !deactivatedCurrencyIds.has(c.id)),
    [deactivatedCurrencyIds],
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
