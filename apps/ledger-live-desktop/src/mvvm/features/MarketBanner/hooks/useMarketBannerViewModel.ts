import { useCallback, useMemo } from "react";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { filterMarketPerformersByAvailability } from "@ledgerhq/live-common/market/utils/index";
import {
  KeysPriceChange,
  type MarketCurrencyData,
  type MarketItemPerformer,
  Order,
} from "@ledgerhq/live-common/market/utils/types";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  TIME_RANGE,
  MARKET_BANNER_TOP,
  MARKET_PERFORMERS_SUPPORTED,
  MARKET_BANNER_REFRESH_RATE,
} from "@ledgerhq/live-common/market/constants";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  starredMarketCoinsSelector,
} from "~/renderer/reducers/settings";
import {
  selectMarketBannerRanking,
  type MarketBannerRanking,
} from "~/renderer/reducers/marketBanner";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MARKET_BANNER_ITEMS_COUNT } from "../utils/constants";

/** Ranking shown when the asset discoverability flag is off. */
const DEFAULT_RANKING_WITHOUT_DISCOVERABILITY: MarketBannerRanking = "gainers";

/** Valid `pageSize` values are 1 / 5 / 20 / 50; 50 covers the favorites banner item cap. */
const MARKET_BANNER_FAVORITES_LIMIT = 50;

export type MarketBannerItems = {
  items: MarketItemPerformer[];
  isLoading: boolean;
  isError: boolean;
};

function toPerformer(currency: MarketCurrencyData): MarketItemPerformer {
  const change = currency.priceChangePercentage;
  return {
    id: currency.id,
    name: currency.name,
    ticker: currency.ticker,
    ledgerIds: currency.ledgerIds,
    image: currency.image ?? "",
    price: currency.price,
    priceChangePercentage1h: change[KeysPriceChange.hour] ?? 0,
    priceChangePercentage24h: change[KeysPriceChange.day] ?? 0,
    priceChangePercentage7d: change[KeysPriceChange.week] ?? 0,
    priceChangePercentage30d: change[KeysPriceChange.month] ?? 0,
    priceChangePercentage1y: change[KeysPriceChange.year] ?? 0,
  };
}

function useMarketAvailabilityFilter() {
  const { isCurrencyAvailable } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();
  const currenciesForSwapAllSet = useMemo(
    () => new Set(currenciesForSwapAll ?? []),
    [currenciesForSwapAll],
  );

  return useCallback(
    (items: MarketItemPerformer[]) =>
      filterMarketPerformersByAvailability(
        items,
        isCurrencyAvailable,
        currenciesForSwapAllSet,
        MARKET_BANNER_ITEMS_COUNT,
      ),
    [isCurrencyAvailable, currenciesForSwapAllSet],
  );
}

export function usePerformersBannerItems(
  ranking: MarketBannerRanking,
  options?: { skip?: boolean },
): MarketBannerItems {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const filterItems = useMarketAvailabilityFilter();

  const { data, isError, isLoading, isFetching } = useMarketPerformers(
    {
      sort: ranking === "losers" ? "desc" : "asc",
      counterCurrency: counterValueCurrency.ticker,
      range: TIME_RANGE,
      limit: MARKET_BANNER_TOP,
      top: MARKET_BANNER_TOP,
      supported: MARKET_PERFORMERS_SUPPORTED,
      refreshRate: MARKET_BANNER_REFRESH_RATE,
    },
    { skip: options?.skip },
  );

  const items = useMemo(() => filterItems(data ?? []), [filterItems, data]);

  return {
    items,
    isLoading: isLoading || (isFetching && !data),
    isError: isError && !isFetching,
  };
}

// Availability filtering is bypassed so a starred coin shows even when not swap-available.
// The endpoint returns the whole market when no `ids` are sent, so the query is disabled when
// there are no starred coins (or favorites is not active).
export function useFavoritesBannerItems(options?: { skip?: boolean }): MarketBannerItems {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);

  const sortedStarredIds = useMemo(
    () => [...starredMarketCoins].sort((a, b) => a.localeCompare(b)),
    [starredMarketCoins],
  );

  const { data, isError, isLoading, isFetching } = useMarketData(
    {
      counterCurrency: counterValueCurrency.ticker.toLowerCase(),
      range: "24h",
      order: Order.MarketCapDesc,
      limit: MARKET_BANNER_FAVORITES_LIMIT,
      starred: sortedStarredIds,
    },
    { enabled: !options?.skip && sortedStarredIds.length > 0 },
  );

  const items = useMemo(() => data.map(toPerformer).slice(0, MARKET_BANNER_ITEMS_COUNT), [data]);

  return {
    items,
    isLoading,
    isError: isError && !isFetching,
  };
}

export function useMarketBannerViewModel(): MarketBannerItems {
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("desktop");
  const persistedRanking = useSelector(selectMarketBannerRanking);
  const ranking = shouldDisplayAssetDiscoverability
    ? persistedRanking
    : DEFAULT_RANKING_WITHOUT_DISCOVERABILITY;
  const isFavorites = ranking === "favorites";

  const performers = usePerformersBannerItems(ranking, { skip: isFavorites });
  const favorites = useFavoritesBannerItems({ skip: !isFavorites });

  return isFavorites ? favorites : performers;
}
