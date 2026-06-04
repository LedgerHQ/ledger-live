import { useCallback, useMemo, useState } from "react";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { KeysPriceChange, Order } from "@ledgerhq/live-common/market/utils/types";
import { useLocale, useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { mapMarketCurrencyToDisplayData } from "../../utils/marketAssetDisplay";

const DEFAULT_RANGE = KeysPriceChange.day;
const PAGE_SIZE = 20;

export interface MarketAssetsResult {
  assets: MarketAssetDisplayData[];
  loading: boolean;
  loadingMore: boolean;
  isError: boolean;
  onEndReached: () => void;
}

export function useMarketAssets(): MarketAssetsResult {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const [page, setPage] = useState(1);

  const result = useMarketData({
    counterCurrency,
    range: DEFAULT_RANGE,
    order: Order.MarketCapDesc,
    limit: PAGE_SIZE,
    liveCompatible: true,
    page,
  });

  const assets = useMemo(() => {
    const uniqueById = [...new Map(result.data.map(item => [item.id, item])).values()];
    return uniqueById.map(item =>
      mapMarketCurrencyToDisplayData(item, {
        counterCurrency,
        counterValueUnit,
        range: DEFAULT_RANGE,
        locale,
        t,
      }),
    );
  }, [result.data, counterCurrency, counterValueUnit, locale, t]);

  const onEndReached = useCallback(() => setPage(current => current + 1), []);

  const hasData = assets.length > 0;

  return {
    assets,
    loading: (result.isLoading || result.isPending) && !hasData,
    loadingMore: result.isFetching && hasData,
    isError: result.isError,
    onEndReached,
  };
}
