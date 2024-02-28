import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { listCryptoCurrencies, listSupportedCurrencies, listTokens } from "../../currencies";
import { getEnv } from "@ledgerhq/live-env";
import {
  CurrencyData,
  MarketCoin,
  MarketCurrencyChartDataRequestParams,
  MarketListRequestParams,
  SupportedCoins,
} from "../types";
import { rangeDataTable } from "../utils/rangeDataTable";
import { currencyFormatter, format } from "../utils/currencyFormatter";

const cryptoCurrenciesList = [...listCryptoCurrencies(), ...listTokens()];

const supportedCurrencies = listSupportedCurrencies();

const liveCompatibleIds: string[] = supportedCurrencies
  .map(({ id }: CryptoCurrency) => id)
  .filter(Boolean);

let LIVE_COINS_LIST: string[] = [];

const ROOT_PATH = getEnv("MARKET_API_URL");

let SUPPORTED_COINS_LIST: SupportedCoins = [];

async function setSupportedCoinsList(): Promise<SupportedCoins> {
  const url = `${ROOT_PATH}/coins/list`;
  const { data } = await network({ method: "GET", url });

  SUPPORTED_COINS_LIST = data;

  LIVE_COINS_LIST = SUPPORTED_COINS_LIST.filter(({ id }) => liveCompatibleIds.includes(id)).map(
    ({ id }) => id,
  );

  return SUPPORTED_COINS_LIST;
}

const matchSearch =
  (search: string) =>
  (currency: MarketCoin): boolean => {
    if (!search) return false;
    const match = `${currency.symbol}|${currency.name}`;
    return match.toLowerCase().includes(search.toLowerCase());
  };

// fetches currencies data for selected currencies ids
async function listPaginated({
  counterCurrency,
  range = "24h",
  limit = 50,
  page = 1,
  ids: _ids = [],
  starred = [],
  orderBy = "market_cap",
  order = "desc",
  search = "",
  sparkline = true,
  liveCompatible = false,
  top100 = false,
}: MarketListRequestParams): Promise<CurrencyData[]> {
  let ids = _ids;

  if (top100) {
    limit = 100;
  } else {
    if (search) {
      ids = SUPPORTED_COINS_LIST.filter(matchSearch(search)).map(({ id }) => id);
      if (!ids.length) {
        return [];
      }
    }

    if (liveCompatible) {
      if (ids.length > 0) {
        ids = LIVE_COINS_LIST.filter(id => ids.includes(id));
      } else {
        ids = ids.concat(LIVE_COINS_LIST);
      }
    }

    if (starred.length > 0) {
      if (ids.length > 0) {
        ids = starred.filter(id => ids.includes(id));
      } else {
        ids = ids.concat(starred);
      }
    }
  }

  ids = ids.slice((page - 1) * limit, limit * page);

  const url =
    `${ROOT_PATH}/coins/markets?vs_currency=${counterCurrency}&order=${orderBy}_${order}&per_page=${limit}` +
    `&sparkline=${sparkline ? "true" : "false"}&price_change_percentage=${range}` +
    `${ids.length > 0 ? `&page=1&&ids=${ids.toString()}` : `&page=${page}`}`;

  let { data } = await network({
    method: "GET",
    url,
  });

  if (top100) {
    // Perform a search by the user's input and order the result by change in percentage
    data = data
      .filter(currency => {
        if (!search) return true;
        const match = `${currency.symbol}|${currency.name}`;
        return match.toLowerCase().includes(search.toLowerCase());
      })
      .sort(
        (a, b) =>
          b[`price_change_percentage_${range}_in_currency`] -
          a[`price_change_percentage_${range}_in_currency`],
      );
  }

  return currencyFormatter(data, range, cryptoCurrenciesList, LIVE_COINS_LIST);
}

// Fetches list of supported counterCurrencies
export async function supportedCounterCurrencies(): Promise<string[]> {
  const url = `${ROOT_PATH}/simple/supported_vs_currencies`;

  const { data } = await network({
    method: "GET",
    url,
  });

  return data;
}

export async function fetchCurrencyChartData({
  id,
  counterCurrency,
  range = "24h",
}: MarketCurrencyChartDataRequestParams): Promise<Record<string, [number, number][]>> {
  const { days, interval } = rangeDataTable[range];
  const url = `${ROOT_PATH}/coins/${id}/market_chart?vs_currency=${counterCurrency}&days=${days}&interval=${interval}`;

  const { data } = await network({
    method: "GET",
    url,
  });

  return { [range]: data.prices };
}

export async function fetchCurrencyData({
  counterCurrency,
  range = "24h",
  id,
}: MarketCurrencyChartDataRequestParams): Promise<CurrencyData> {
  const url =
    `${ROOT_PATH}/coins/markets?vs_currency=${counterCurrency}` +
    `&sparkline=true&price_change_percentage=${range}` +
    `&page=1&&ids=${id}`;

  const { data } = await network({
    method: "GET",
    url,
  });

  return currencyFormatter(data, range, cryptoCurrenciesList, LIVE_COINS_LIST)[0];
}

export async function fetchCurrency({
  id,
}: MarketCurrencyChartDataRequestParams): Promise<CurrencyData> {
  const url = `${ROOT_PATH}/coins/${id}`;

  const { data } = await network({
    method: "GET",
    url,
  });

  return format(data, "24h", cryptoCurrenciesList, LIVE_COINS_LIST);
}

export default {
  setSupportedCoinsList,
  listPaginated,
  supportedCounterCurrencies,
  currencyChartData: fetchCurrencyChartData,
};
