import { Order } from "@ledgerhq/live-common/market/utils/types";
import type { MarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import type { MarketListFilterTimeframe, MarketListSorting } from "~/reducers/types";
import { getMarketListOrder } from "./marketListFilters";

type SortDirection = "asc" | "desc";
type SortToggleValue = "false" | "true_asc" | "true_desc";

function getSortDirection(
  order: Order,
  descOrder: Order,
  ascOrder: Order,
): SortDirection | undefined {
  if (order === descOrder) return "desc";
  if (order === ascOrder) return "asc";
  return undefined;
}

function getSortToggleValue(order: Order, descOrder: Order, ascOrder: Order): SortToggleValue {
  const direction = getSortDirection(order, descOrder, ascOrder);
  if (direction === "desc") return "true_desc";
  if (direction === "asc") return "true_asc";
  return "false";
}

function getCategoryName(category: MarketListCategory): string {
  return category === "starred" ? "favorites" : category;
}

export function getMarketSortListTracking(
  sorting: MarketListSorting,
  timeframe: MarketListFilterTimeframe,
) {
  const order = getMarketListOrder(sorting);

  return {
    sortVolume: getSortToggleValue(order, Order.VolumeDesc, Order.VolumeAsc),
    sortMarketCap: getSortToggleValue(order, Order.MarketCapDesc, Order.MarketCapAsc),
    sortChange: getSortToggleValue(order, Order.topGainers, Order.topLosers),
    timeframe,
  };
}

export function getMarketPageTracking({
  sorting,
  timeframe,
  category,
}: {
  sorting: MarketListSorting;
  timeframe: MarketListFilterTimeframe;
  category: MarketListCategory;
}) {
  const order = getMarketListOrder(sorting);

  return {
    sortVolume: getSortDirection(order, Order.VolumeDesc, Order.VolumeAsc) ?? "desc",
    sortMarketCap: getSortDirection(order, Order.MarketCapDesc, Order.MarketCapAsc) ?? "desc",
    sortChange: getSortDirection(order, Order.topGainers, Order.topLosers) ?? "desc",
    timeframe,
    category: getCategoryName(category),
  };
}
