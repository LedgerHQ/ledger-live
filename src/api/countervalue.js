/**
 * @flow
 * @module api/countervalue
 */
import querystring from "querystring";
import axios from "axios";
import type {
  Currency,
  FiatUnit,
  CounterValuesPairing,
  Histoday
} from "../types";
import { formatCounterValueDayUTC } from "../helpers/countervalue";
import { deprecateRenamedFunction } from "../internal";

const convertToCentPerSat = (
  currency: Currency,
  fiatUnit: FiatUnit,
  value: number
): number => value * 10 ** (fiatUnit.magnitude - currency.units[0].magnitude);

/**
 * @memberof api/countervalue
 */
export async function fetchCurrentRates(
  currencies: Currency[],
  fiatUnit: FiatUnit
): Promise<CounterValuesPairing<{ latest: number }>> {
  const { data }: { data: mixed } = await axios.get(
    "https://min-api.cryptocompare.com/data/pricemulti?" +
      querystring.stringify({
        extraParams: "ledger-test",
        fsyms: currencies.map(c => c.ticker).join(","),
        tsyms: fiatUnit.ticker
      })
  );
  const out = {};
  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (data && typeof data === "object") {
    Object.keys(data).forEach(ticker => {
      const currency = currencies.find(c => c.ticker === ticker);
      const map = data[ticker];
      if (currency && map && typeof map === "object") {
        const value = map[fiatUnit.ticker];
        if (typeof value === "number") {
          out[ticker] = {
            [fiatUnit.ticker]: {
              latest: convertToCentPerSat(currency, fiatUnit, value)
            }
          };
        }
      }
    });
  }
  return out;
}

/**
 * @return the latest day available on the server in YYYY-MM-DD format
 * NB this is not so trivial because this needs to use same timezone as the server
 */
export function getLatestDayAvailable(): string {
  const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
  return formatCounterValueDayUTC(oneDayAgo);
}

/**
 * Fetch countervalue rates history for crypto currencies (or a currency)
 * per day granularity.
 * @param getLatestDayFetched will returns for a currency the latest day that
 * is already loaded and don't need to be refreshed.
 * It returns this in YYYY-MM-DD format.
 * If data was never loaded OR all data needs to be refetched,
 * you can return a falsy value.
 * NOTE: This allow implementation to do two things:
 * - don't fetch anything if current day is the latest
 * - only fetch part of the data that are missing (patch)
 * @return a subset of pairs with only the new data (regarding getLatestDayFetched)
 * @memberof api/countervalue
 */
export async function fetchHistodayRates(
  currencyOrCurrencies: Currency | Currency[],
  fiatUnit: FiatUnit,
  getLatestDayFetched?: Currency => ?string = () => null
): Promise<CounterValuesPairing<Histoday>> {
  if (Array.isArray(currencyOrCurrencies)) {
    // NB in the future we want a single API call
    return Promise.all(
      currencyOrCurrencies.map(currency =>
        fetchHistodayRates(currency, fiatUnit)
      )
    ).then(all => {
      const data = {};
      all.forEach((histoday, i) => {
        const currency = currencyOrCurrencies[i];
        // FIXME in future need to have currency.ticker
        data[currency.ticker] = {
          // FIXME same
          [fiatUnit.ticker]: histoday
        };
      });
      return data;
    });
  }
  const latestDayFetched = getLatestDayFetched(currencyOrCurrencies);
  if (latestDayFetched && latestDayFetched === getLatestDayAvailable()) {
    return {};
  }
  // TODO later our API should accept from which date we want to pull
  const { data }: { data: mixed } = await axios.get(
    "https://min-api.cryptocompare.com/data/histoday?" +
      querystring.stringify({
        extraParams: "ledger-test",
        fsym: currencyOrCurrencies.ticker,
        tsym: fiatUnit.ticker,
        allData: 1
      })
  );
  const out = {};

  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (data && typeof data === "object" && Array.isArray(data.Data)) {
    for (const item of data.Data) {
      if (!item || typeof item !== "object") continue;
      const { time, close } = item;
      if (typeof close !== "number" || typeof time !== "number") continue;
      const day = formatCounterValueDayUTC(new Date(time * 1000));
      out[day] = convertToCentPerSat(currencyOrCurrencies, fiatUnit, close);
    }
  }

  return out;
}

// DEPRECATED

export const fetchCurrentCounterValues = deprecateRenamedFunction(
  "fetchCurrentCounterValues",
  fetchCurrentRates
);
export const fetchHistodayCounterValues = deprecateRenamedFunction(
  "fetchHistodayCounterValues",
  fetchHistodayRates
);
export const fetchHistodayCounterValuesMultiple = deprecateRenamedFunction(
  "fetchHistodayCounterValuesMultiple",
  fetchHistodayRates
);
