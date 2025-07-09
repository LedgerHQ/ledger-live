import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook";
import { useMemo } from "react";

export function useInitModularDrawer() {
  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider, sortedCryptoCurrencies } = useMemo(() => {
    return {
      currenciesByProvider: result.currenciesByProvider ?? [],
      sortedCryptoCurrencies: result.sortedCryptoCurrencies ?? [],
    };
  }, [result]);

  const isReadyToBeDisplayed = [LoadingStatus.Success].includes(providersLoadingStatus);

  return {
    currenciesByProvider,
    sortedCryptoCurrencies,
    isReadyToBeDisplayed,
  };
}
