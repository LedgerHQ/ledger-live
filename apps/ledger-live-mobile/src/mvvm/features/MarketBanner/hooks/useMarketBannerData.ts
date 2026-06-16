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
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, starredMarketCoinsSelector } from "~/reducers/settings";
import type { MarketBannerRanking } from "~/reducers/types";
import { MARKET_BANNER_TILE_COUNT } from "../constants";

const LIMIT = MARKET_BANNER_TILE_COUNT * 2;

/** `useMarketData` (the /v3/markets endpoint) only accepts pageSize 1 / 5 / 20 / 50. */
const MARKET_BANNER_FAVORITES_LIMIT = 50;

export type MarketBannerItems = {
  items: MarketItemPerformer[];
  isError: boolean;
};

function toPerformer(currency: MarketCurrencyData): MarketItemPerformer {
  const change = currency.priceChangePercentage;
  return {
    id: currency.id,
    name: currency.name,
    ticker: currency.ticker,
    priceChangePercentage1h: change[KeysPriceChange.hour] ?? 0,
    priceChangePercentage24h: change[KeysPriceChange.day] ?? 0,
    priceChangePercentage7d: change[KeysPriceChange.week] ?? 0,
    priceChangePercentage30d: change[KeysPriceChange.month] ?? 0,
    priceChangePercentage1y: change[KeysPriceChange.year] ?? 0,
    image: currency.image ?? "",
    price: currency.price,
    ledgerIds: currency.ledgerIds,
  };
}

/** Keeps only assets that are buyable/swappable, capped to the banner tile count. */
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
        MARKET_BANNER_TILE_COUNT,
      ),
    [isCurrencyAvailable, currenciesForSwapAllSet],
  );
}

/**
 * Performers-based rankings (trending / gainers → positive change, losers → negative).
 * Backed by RTK Query — no React Query dependency.
 */
export function usePerformersBannerItems(ranking: MarketBannerRanking): MarketBannerItems {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const filterItems = useMarketAvailabilityFilter();

  const { data, isError, isFetching } = useMarketPerformers({
    sort: ranking === "losers" ? "desc" : "asc",
    counterCurrency: counterValueCurrency.ticker,
    range: TIME_RANGE,
    limit: LIMIT,
    top: MARKET_BANNER_TOP,
    supported: MARKET_PERFORMERS_SUPPORTED,
    refreshRate: MARKET_BANNER_REFRESH_RATE,
  });

  const items = useMemo(() => filterItems(data ?? []), [filterItems, data]);

  return { items, isError: isError && !isFetching };
}

/**
 * Favorites ranking → the user's starred assets. Backed by React Query (`useMarketData`),
 * so this hook must only be mounted when the favorites ranking is actually active.
 * Availability filtering is bypassed so a starred coin shows even when not buyable/swappable.
 */
export function useFavoritesBannerItems(): MarketBannerItems {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);

  const sortedStarredIds = useMemo(
    () => [...starredMarketCoins].sort((a, b) => a.localeCompare(b)),
    [starredMarketCoins],
  );

  const { data, isError, isFetching } = useMarketData(
    {
      counterCurrency: counterValueCurrency.ticker.toLowerCase(),
      range: "24h",
      order: Order.MarketCapDesc,
      limit: MARKET_BANNER_FAVORITES_LIMIT,
      starred: sortedStarredIds,
    },
    { enabled: sortedStarredIds.length > 0 },
  );

  const items = useMemo(() => data.map(toPerformer).slice(0, MARKET_BANNER_TILE_COUNT), [data]);

  return { items, isError: isError && !isFetching };
}
