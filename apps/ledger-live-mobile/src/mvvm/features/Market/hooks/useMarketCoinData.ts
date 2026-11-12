import { useMemo } from "react";
import { useCurrencyData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useMarketCounterValueRate } from "@ledgerhq/live-common/market/hooks/useMarketCounterValueRate";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";

import { useSelector } from "~/context/hooks";
import { marketParamsSelector } from "~/reducers/market";
import { counterValueCurrencySelector } from "~/reducers/settings";

type HookProps = {
  currencyId: string;
};

export const useMarketCoinData = ({ currencyId }: HookProps) => {
  const marketParams = useSelector(marketParamsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { counterCurrency: settingsCounterCurrency = "usd" } = marketParams;
  const {
    requestCounterCurrency,
    displayCounterCurrency = settingsCounterCurrency,
    rate,
    isResolutionLoading,
    isLoading: isCounterValueLoading,
  } = useMarketCounterValueRate({
    counterCurrency: settingsCounterCurrency,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue: counterValueCurrency.type === "CryptoCurrency",
  });

  const { data, isFetching, refetch } = useCurrencyData(
    {
      counterCurrency: requestCounterCurrency,
      id: currencyId,
    },
    { skip: isResolutionLoading },
  );
  const currency = useMemo(() => {
    if (isResolutionLoading || rate == null || !data) return undefined;
    return applyUsdRateToMarket(data, rate);
  }, [data, isResolutionLoading, rate]);

  return {
    counterCurrency: displayCounterCurrency,
    currency,
    loading: isCounterValueLoading || isFetching,
    refetch,
  };
};
