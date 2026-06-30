import { useEffect } from "react";
import type { MarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import { KeysPriceChange, Order } from "@ledgerhq/live-common/market/utils/types";
import { trackPage } from "~/renderer/analytics/segment";

export type MarketSortDirection = "asc" | "desc";

export function getMarketSortDirection(
  order: Order | undefined,
  descOrder: Order,
  ascOrder: Order,
): MarketSortDirection | undefined {
  if (order === descOrder) return "desc";
  if (order === ascOrder) return "asc";
  return undefined;
}

export function getMarketPageSortAnalytics(
  order: Order | undefined,
  descOrder: Order,
  ascOrder: Order,
): MarketSortDirection {
  return getMarketSortDirection(order, descOrder, ascOrder) ?? "desc";
}

const MARKET_RANGE_TO_TIMEFRAME: Record<string, string> = {
  [KeysPriceChange.day]: "1D",
  [KeysPriceChange.week]: "7D",
  [KeysPriceChange.month]: "30D",
  [KeysPriceChange.sixMonths]: "6M",
  [KeysPriceChange.year]: "1Y",
};

export function getMarketPageTimeframeAnalytics(range: string | undefined): string | undefined {
  if (!range) return undefined;
  return MARKET_RANGE_TO_TIMEFRAME[range] ?? range;
}

export type MarketSortToggleValue = "false" | "true_asc" | "true_desc";

export function getMarketSortToggleValue(
  order: Order | undefined,
  descOrder: Order,
  ascOrder: Order,
): MarketSortToggleValue {
  const direction = getMarketSortDirection(order, descOrder, ascOrder);
  if (direction === "desc") return "true_desc";
  if (direction === "asc") return "true_asc";
  return "false";
}

export function getMarketSortListAnalytics({
  order,
  range,
}: {
  order: Order | undefined;
  range: string | undefined;
}) {
  return {
    sortVolume: getMarketSortToggleValue(order, Order.VolumeDesc, Order.VolumeAsc),
    sortMarketCap: getMarketSortToggleValue(order, Order.MarketCapDesc, Order.MarketCapAsc),
    sortChange: getMarketSortToggleValue(order, Order.topGainers, Order.topLosers),
    timeframe: getMarketPageTimeframeAnalytics(range),
  };
}

export function getMarketPageCategoryAnalytics(category: MarketListCategory): string {
  if (category === "starred") return "favorites";
  return category;
}

export type MarketDiscoverabilityPageAnalyticsParams = {
  order: Order | undefined;
  range: string | undefined;
  category: MarketListCategory;
};

export function getMarketDiscoverabilityPageAnalytics({
  order,
  range,
  category,
}: MarketDiscoverabilityPageAnalyticsParams) {
  return {
    sortVolume: getMarketPageSortAnalytics(order, Order.VolumeDesc, Order.VolumeAsc),
    sortMarketCap: getMarketPageSortAnalytics(order, Order.MarketCapDesc, Order.MarketCapAsc),
    sortChange: getMarketPageSortAnalytics(order, Order.topGainers, Order.topLosers),
    timeframe: getMarketPageTimeframeAnalytics(range),
    category: getMarketPageCategoryAnalytics(category),
  };
}

export function useTrackMarketDiscoverabilityPage(
  enabled: boolean,
  params: MarketDiscoverabilityPageAnalyticsParams,
) {
  const { order, range, category } = params;

  useEffect(() => {
    if (!enabled) return;

    trackPage(
      "Market",
      undefined,
      getMarketDiscoverabilityPageAnalytics({ order, range, category }),
      true,
      true,
      false,
    );
  }, [enabled, order, range, category]);
}
