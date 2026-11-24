import {
  Order,
  type MarketCurrency,
  type MarketListQueryArg,
} from "@domain/entity-market-currency";
import { getSortParam } from "./sort";

/** Query params of one `/v3/markets` page of the market list. */
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

/** The next page to load, or `undefined` when the list is complete or the limit is reached. */
export function getNextMarketListPage(
  lastPage: MarketCurrency[],
  allPages: MarketCurrency[][],
  lastPageParam: number,
  queryArg: MarketListQueryArg,
): number | undefined {
  if (lastPage.length < queryArg.pageSize) return undefined;

  const loadedCount = allPages.reduce((count, page) => count + page.length, 0);
  if (queryArg.limit !== undefined && loadedCount >= queryArg.limit) return undefined;

  return lastPageParam + 1;
}
