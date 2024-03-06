import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  starredMarketCoinsSelector,
  localeSelector,
  getCounterValueCode,
} from "~/renderer/reducers/settings";
import { useCallback, useMemo, useState } from "react";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";
import { useTheme } from "styled-components";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import {
  useCurrencyChartData,
  useCurrencyData,
  useMarketDataProvider,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { Page, useMarketActions } from "./useMarketActions";

const ranges = Object.keys(rangeDataTable).filter(k => k !== "1h");

export const useMarketCoin = () => {
  const [range, setRange] = useState<string>("24h");
  const counterValueCurrencyLocal = useSelector(getCounterValueCode);
  const [counterCurrency, setCounterCurrency] = useState(counterValueCurrencyLocal);

  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { currencyId } = useParams<{ currencyId: string }>();

  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const { liveCoinsList, supportedCounterCurrencies } = useMarketDataProvider();

  const isStarred = starredMarketCoins.includes(currencyId);
  const locale = useSelector(localeSelector);

  const resCurrencyChartData = useCurrencyChartData({
    counterCurrency,
    id: currencyId,
    ranges,
  });

  const { currencyDataByRanges, currencyInfo } = useCurrencyData({
    counterCurrency,
    id: currencyId,
    ranges,
  });

  const dataChart = useMemo(
    () => resCurrencyChartData?.[ranges.indexOf(range)].data,
    [range, resCurrencyChartData],
  );
  const isLoadingDataChart = useMemo(
    () => resCurrencyChartData?.[ranges.indexOf(range)].isLoading,
    [range, resCurrencyChartData],
  );

  const dataCurrency = useMemo(
    () => currencyDataByRanges?.[ranges.indexOf(range)].data,
    [range, currencyDataByRanges],
  );

  const isLoadingData = useMemo(
    () => currencyDataByRanges?.[ranges.indexOf(range)].isLoading,
    [range, currencyDataByRanges],
  );

  const currency = useMemo(() => currencyInfo?.data, [currencyInfo]);

  const { id, internalCurrency } = currency || {};

  const { onBuy, onStake, onSwap, availableOnBuy, availableOnStake, availableOnSwap } =
    useMarketActions({
      currency,
      page: Page.MarketCoin,
    });

  const color = internalCurrency
    ? getCurrencyColor(internalCurrency, colors.background.main)
    : colors.primary.c80;

  const toggleStar = useCallback(() => {
    if (isStarred) {
      id && dispatch(removeStarredMarketCoins(id));
    } else {
      id && dispatch(addStarredMarketCoins(id));
    }
  }, [dispatch, isStarred, id]);

  const changeRange = useCallback((range: string) => {
    setRange(range);
  }, []);

  const changeCounterCurrency = useCallback((currency: string) => {
    setCounterCurrency(currency);
  }, []);

  return {
    isStarred,
    locale,
    onBuy,
    onStake,
    onSwap,
    toggleStar,
    color,
    dataCurrency,
    dataChart,
    isLoadingDataChart,
    isLoadingData,
    changeRange,
    range,
    counterCurrency,
    changeCounterCurrency,
    currency,
    supportedCounterCurrencies,
    liveCoinsList,
    availableOnBuy,
    availableOnStake,
    availableOnSwap,
  };
};
