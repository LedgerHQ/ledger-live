import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { localeSelector } from "~/renderer/reducers/settings";
import { useCallback, useMemo } from "react";
import { useTheme } from "styled-components";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import {
  useCurrencyChartData,
  useCurrencyData,
  useMarketDataProvider,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { Page, useMarketActions } from "./useMarketActions";
import {
  removeStarredMarketCoins,
  addStarredMarketCoins,
  setMarketOptions,
} from "~/renderer/actions/market";
import { marketParamsSelector, starredMarketCoinsSelector } from "~/renderer/reducers/market";

export const useMarketCoin = () => {
  const marketParams = useSelector(marketParamsSelector);
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { currencyId } = useParams<{ currencyId: string }>();

  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const { liveCoinsList, supportedCounterCurrencies } = useMarketDataProvider();

  const isStarred = starredMarketCoins.includes(currencyId);
  const locale = useSelector(localeSelector);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const resCurrencyChartData = useCurrencyChartData({
    counterCurrency,
    id: currencyId,
    range,
  });

  const { currencyData, currencyInfo } = useCurrencyData({
    counterCurrency,
    id: currencyId,
    range,
  });

  const currency = useMemo(() => currencyInfo?.data, [currencyInfo]);
  const isLoadingCurrency = useMemo(() => currencyInfo?.isLoading, [currencyInfo]);

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

  const changeRange = useCallback(
    (range: string) => {
      dispatch(
        setMarketOptions({
          range,
        }),
      );
    },
    [dispatch],
  );

  const changeCounterCurrency = useCallback(
    (ticker: string) => {
      dispatch(
        setMarketOptions({
          counterCurrency: supportedCounterCurrencies?.includes(ticker.toLowerCase())
            ? ticker
            : "usd",
        }),
      );
    },
    [dispatch, supportedCounterCurrencies],
  );
  return {
    isStarred,
    locale,
    onBuy,
    onStake,
    onSwap,
    toggleStar,
    color,
    dataCurrency: currencyData.data,
    dataChart: resCurrencyChartData.data,
    isLoadingDataChart: resCurrencyChartData.isLoading,
    isLoadingData: currencyData.isLoading,
    isLoadingCurrency,
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
