import { useMemo } from "react";
import VersionNumber from "react-native-version-number";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import {
  selectTopAssetsByCategory,
  selectTopStocks,
  type CategorizedDiscoveryAsset,
} from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useLocale, useTranslation } from "~/context/Locale";
import { mapDadaMarketToDisplayData } from "../../utils/mapDadaMarketToDisplayData";
import type { GlobalSearchDefaultSections } from "./types";

const PRODUCT = "llm";
const MAX_CRYPTOS = 3;
const MAX_STABLECOINS = 2;
const MAX_STOCKS = 20;

export type GlobalSearchDefaults = {
  defaultSections: GlobalSearchDefaultSections;
  isLoadingDefaults: boolean;
};

export function useGlobalSearchDefaults(enabled: boolean): GlobalSearchDefaults {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const version = VersionNumber.appVersion ?? "";
  const skip = !enabled;

  const { tickers: stablecoinTickers, isLoading: loadingTickers } = useStablecoinTickers(
    PRODUCT,
    version,
    skip,
  );
  const { data: assetsData, isLoading: loadingAssets } = useAssetsData({
    product: PRODUCT,
    version,
    skip,
  });
  const { data: stocksData, isLoading: loadingStocks } = useStocksData({
    product: PRODUCT,
    version,
    skip,
  });

  const { cryptos, stablecoins } = useMemo(() => {
    if (!assetsData) {
      return {
        cryptos: [] as MarketAssetDisplayData[],
        stablecoins: [] as MarketAssetDisplayData[],
      };
    }

    const categorized = selectTopAssetsByCategory(assetsData, stablecoinTickers, {
      maxCryptos: MAX_CRYPTOS,
      maxStablecoins: MAX_STABLECOINS,
    });
    const toDisplay = (entries: CategorizedDiscoveryAsset[]) =>
      entries.map(({ meta, currency, market }) =>
        mapDadaMarketToDisplayData(
          { id: meta.id, name: meta.name, ticker: meta.ticker, ledgerId: currency.id },
          market,
          { counterCurrency, counterValueUnit, locale, t },
        ),
      );

    return {
      cryptos: toDisplay(categorized.cryptos),
      stablecoins: toDisplay(categorized.stablecoins),
    };
  }, [assetsData, stablecoinTickers, counterCurrency, counterValueUnit, locale, t]);

  const stocks = useMemo(
    () => (stocksData ? selectTopStocks(stocksData, MAX_STOCKS) : []),
    [stocksData],
  );

  const defaultSections = useMemo<GlobalSearchDefaultSections>(
    () => ({ cryptos, stablecoins, stocks }),
    [cryptos, stablecoins, stocks],
  );

  return {
    defaultSections,
    isLoadingDefaults: enabled && (loadingTickers || loadingAssets || loadingStocks),
  };
}
