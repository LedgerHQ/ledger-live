import { useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import {
  selectTopAssetsByCategory,
  selectTopStocks,
} from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useLocale, useTranslation } from "~/context/Locale";
import { mapDadaMarketToDisplayData } from "LLM/features/GlobalSearch/utils/mapDadaMarketToDisplayData";
import type { GlobalSearchDefaultSections } from "LLM/features/GlobalSearch/screens/GlobalSearch/types";

const PRODUCT = "llm";
const MAX_CRYPTOS = 3;
const MAX_STOCKS = 20;

export type GlobalSearchDefaults = {
  defaultSections: GlobalSearchDefaultSections;
  isLoadingDefaults: boolean;
  hasError: boolean;
};

export function useGlobalSearchDefaults(enabled: boolean): GlobalSearchDefaults {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const { rate: usdToFiatRate, status: rateStatus } = useUsdToFiatRate(counterValueCurrency.ticker);
  const version = VersionNumber.appVersion ?? "";
  const skip = !enabled;

  const { tickers: stablecoinTickers, isLoading: loadingTickers } = useStablecoinTickers(
    PRODUCT,
    version,
    skip,
  );
  const {
    data: assetsData,
    isLoading: loadingAssets,
    isError: assetsError,
  } = useAssetsData({
    product: PRODUCT,
    version,
    skip,
  });
  const { data: stocksData, isLoading: loadingStocks } = useStocksData({
    product: PRODUCT,
    version,
    skip,
  });

  const cryptos = useMemo<MarketAssetDisplayData[]>(() => {
    if (!assetsData) return [];

    const { cryptos: topCryptos } = selectTopAssetsByCategory(assetsData, stablecoinTickers, {
      maxCryptos: MAX_CRYPTOS,
      maxStablecoins: 0,
    });

    return topCryptos.map(({ meta, currency, market }) =>
      mapDadaMarketToDisplayData(
        { id: meta.id, name: meta.name, ticker: meta.ticker, ledgerId: currency.id },
        market,
        { counterCurrency, counterValueUnit, usdToFiatRate, locale, t },
      ),
    );
  }, [assetsData, stablecoinTickers, counterCurrency, counterValueUnit, usdToFiatRate, locale, t]);

  const stocks = useMemo(
    () => (stocksData ? selectTopStocks(stocksData, MAX_STOCKS) : []),
    [stocksData],
  );

  const defaultSections = useMemo<GlobalSearchDefaultSections>(
    () => ({ cryptos, stocks }),
    [cryptos, stocks],
  );

  return {
    defaultSections,
    isLoadingDefaults:
      enabled && (loadingTickers || loadingAssets || loadingStocks || rateStatus === "loading"),
    hasError: enabled && assetsError,
  };
}
