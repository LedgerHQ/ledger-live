import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useTheme } from "styled-components";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import {
  useCurrencyChartData,
  useCurrencyData,
  useMarketDataProvider,
} from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { Page, useMarketActions } from "./useMarketActions";
import { useCallback } from "react";
import { useParams } from "react-router";
import { setMarketOptions } from "~/renderer/actions/market";
import { marketParamsSelector } from "~/renderer/reducers/market";
import { localeSelector, starredMarketCoinsSelector } from "~/renderer/reducers/settings";
import { removeStarredMarketCoins, addStarredMarketCoins } from "~/renderer/actions/settings";
import { selectCurrency } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";

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

  const { data: currency, isLoading } = useCurrencyData({
    counterCurrency,
    id: currencyId,
  });

  const { data: assetData } = assetsDataApi.useGetAssetDataQuery(
    {
      currencyIds: currency?.ledgerIds,
      product: "lld",
      version: __APP_VERSION__,
      isStaging: false,
      includeTestNetworks: false,
    },
    {
      skip: !currency?.ledgerIds?.length,
    },
  );

  const { id } = currency || {};

  const ledgerCurrency = assetData && selectCurrency(assetData);

  const { onBuy, onStake, onSwap, availableOnBuy, availableOnStake, availableOnSwap } =
    useMarketActions({
      currency: currency,
      page: Page.MarketCoin,
    });

  const color = ledgerCurrency
    ? getCurrencyColor(ledgerCurrency, colors.background.main)
    : colors.primary.c80;

  const toggleStar = useCallback(() => {
    if (!id) return;
    dispatch(isStarred ? removeStarredMarketCoins(id) : addStarredMarketCoins(id));
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
    dataChart: resCurrencyChartData.data,
    isLoadingDataChart: resCurrencyChartData.isLoading,
    isLoadingCurrency: isLoading,
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
