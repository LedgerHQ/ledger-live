import { useSelector } from "react-redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useCallback, useMemo, useState } from "react";
import { Order } from "./types";

import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { getSlicedList } from "./utils";
import { useMarketPerformanceFeatureFlag } from "~/renderer/actions/marketperformance";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { listTokens } from "@ledgerhq/cryptoassets/tokens";

type CurrencyCheck = "onRamp" | "swap";

const LIMIT_TO_DISPLAY = 5;

export function useMarketPerformanceWidget() {
  const { isCurrencyAvailable } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();

  const cryptoCurrenciesList = useMemo(() => [...listCryptoCurrencies(), ...listTokens()], []);

  const cryptoCurrenciesSet = useMemo(
    () => new Set(cryptoCurrenciesList.map(({ id }) => id.toLowerCase())),
    [cryptoCurrenciesList],
  );

  const currenciesForSwapAllSet = useMemo(
    () => new Set(currenciesForSwapAll),
    [currenciesForSwapAll],
  );

  const isAvailable = useCallback(
    (id: string, type: CurrencyCheck): boolean => {
      return type === "onRamp"
        ? isCurrencyAvailable(id, "onRamp")
        : currenciesForSwapAllSet.has(id);
    },
    [currenciesForSwapAllSet, isCurrencyAvailable],
  );

  const filterAvailableBuyOrSwapCurrency = useCallback(
    (elem: MarketItemPerformer): boolean => {
      const isCurrencyInLedger = elem.ledgerIds.some(ledgerId =>
        cryptoCurrenciesSet.has(ledgerId.toLowerCase()),
      );

      const isAvailableOnBuyOrSwap = ["onRamp", "swap"].some(
        (type: string) =>
          isAvailable(elem.id, type as CurrencyCheck) ||
          elem.ledgerIds.some(lrId => isAvailable(lrId, type as CurrencyCheck)),
      );

      return isCurrencyInLedger && isAvailableOnBuyOrSwap;
    },
    [cryptoCurrenciesSet, isAvailable],
  );

  const { refreshRate, top, supported, limit, enableNewFeature } =
    useMarketPerformanceFeatureFlag();

  const [order, setOrder] = useState<Order>(Order.asc);

  const timeRange = useSelector(selectedTimeRangeSelector);
  const countervalue = useSelector(counterValueCurrencySelector);

  const { data, isError, isLoading } = useMarketPerformers({
    sort: order,
    counterCurrency: countervalue.ticker,
    range: timeRange,
    limit: enableNewFeature ? limit : LIMIT_TO_DISPLAY,
    top,
    supported,
    refreshRate,
  });

  const sliced = useMemo(() => {
    const baseList = getSlicedList(data ?? [], order, timeRange);

    // Filters only when enableNewFeature is true
    const filteredItems = enableNewFeature
      ? baseList.filter(filterAvailableBuyOrSwapCurrency)
      : baseList;

    const finalItems = filteredItems.length > 0 ? filteredItems : baseList;

    return finalItems.slice(0, LIMIT_TO_DISPLAY);
  }, [data, enableNewFeature, filterAvailableBuyOrSwapCurrency, order, timeRange]);

  return {
    list: sliced,
    order,
    setOrder,
    isLoading,
    hasError: isError,
    range: timeRange,
    top,
  };
}
