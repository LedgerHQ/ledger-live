import network from "@ledgerhq/live-network";
import { getEnv } from "@ledgerhq/live-env";
import {
  MarketListRequestParams,
  MarketItemResponse,
  Order,
  MarketCurrencyRequestParams,
} from "../utils/types";
import URL from "url";
import { getSortParam } from "../utils";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

// fetches currencies data for selected currencies ids
export async function fetchList({
  counterCurrency,
  limit = 50,
  page = 1,
  order = Order.MarketCapDesc,
  search = "",
  liveCompatible = false,
  starred = [],
  range = "24",
}: MarketListRequestParams): Promise<MarketItemResponse[]> {
  const url = URL.format({
    pathname: `${baseURL()}/v3/markets`,
    query: {
      page: page,
      pageSize: limit,
      to: counterCurrency,
      sort: getSortParam(order, range),
      ...(search.length >= 2 && { filter: search }),
      ...(starred.length > 0 && { ids: starred.sort().join(",") }),
      ...(liveCompatible && { supported: liveCompatible }),
      ...([Order.topLosers, Order.topGainers].includes(order) && { top: 100 }),
    },
  });

  const { data } = await network<MarketItemResponse[]>({
    method: "GET",
    url,
  });

  return data;
}

export async function fetchCurrency({
  counterCurrency,
  id,
}: MarketCurrencyRequestParams): Promise<MarketItemResponse> {
  const url = URL.format({
    pathname: `${baseURL()}/v3/markets`,
    query: {
      to: counterCurrency,
      ids: id,
      pageSize: 1,
      limit: 1,
    },
  });

  const { data } = await network<MarketItemResponse[]>({ method: "GET", url });

  return data[0];
}
