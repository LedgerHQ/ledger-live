import {
  MARKET_LIST_MIN_SEARCH_LENGTH,
  MARKET_LIST_PAGE_SIZES,
  type MarketListPageSize,
  type MarketListQueryArg,
} from "../state-manager/types";
import { getSortParam } from "./index";
import { type MarketCurrencyData, type MarketListRequestParams, Order } from "./types";

const DEFAULT_MARKET_LIST_PAGE_SIZE: MarketListPageSize = 50;

const MARKET_LIST_PAGE_SIZE_SET = new Set<number>(MARKET_LIST_PAGE_SIZES);
const RANGE_SORTED_ORDERS = new Set<Order>([Order.topLosers, Order.topGainers]);

function isMarketListPageSize(value: number): value is MarketListPageSize {
  return MARKET_LIST_PAGE_SIZE_SET.has(value);
}

/**
 * `limit` is a page size for 1 / 5 / 20 / 50. Any other value (e.g. the top 100) is a max
 * result count, paginated with the default page size.
 */
export function toMarketListQueryArg({
  counterCurrency,
  limit,
  order,
  range,
  search = "",
  filter,
  starred = [],
  liveCompatible,
  categories,
}: MarketListRequestParams): MarketListQueryArg {
  const normalizedSearch = search.toLowerCase();
  const isPageSize = limit !== undefined && isMarketListPageSize(limit);

  return {
    counterCurrency,
    pageSize: isPageSize ? limit : DEFAULT_MARKET_LIST_PAGE_SIZE,
    ...(limit !== undefined && !isPageSize && { limit }),
    ...(order && { order }),
    ...(order && range && RANGE_SORTED_ORDERS.has(order) && { range }),
    ...(normalizedSearch.length >= MARKET_LIST_MIN_SEARCH_LENGTH && { search: normalizedSearch }),
    ...(filter && { filter }),
    ...(starred.length > 0 && { starred: [...starred].sort((a, b) => a.localeCompare(b)) }),
    ...(liveCompatible && { liveCompatible }),
    ...(categories && { categories }),
  };
}

export function buildMarketListParams({
  queryArg,
  page,
}: {
  queryArg: MarketListQueryArg;
  page: number;
}) {
  const {
    counterCurrency,
    pageSize,
    limit,
    order = Order.MarketCapDesc,
    range = "24",
    search,
    filter,
    starred,
    liveCompatible,
    categories,
  } = queryArg;

  return {
    page,
    pageSize,
    to: counterCurrency,
    sort: getSortParam(order, range),
    limit,
    filter: filter ?? search,
    ids: starred?.join(","),
    supported: liveCompatible,
    categories,
  };
}

export function getNextMarketListPage(
  lastPage: MarketCurrencyData[],
  allPages: MarketCurrencyData[][],
  lastPageParam: number,
  queryArg: MarketListQueryArg,
): number | undefined {
  if (lastPage.length < queryArg.pageSize) return undefined;

  const loadedCount = allPages.reduce((count, page) => count + page.length, 0);
  if (queryArg.limit !== undefined && loadedCount >= queryArg.limit) return undefined;

  return lastPageParam + 1;
}
