/**
 * @flow
 * @module api/countervalue
 */
import querystring from "querystring";
import axios from "axios";
import type { Currency } from "../types";
import { formatCounterValueDayUTC } from "../helpers/countervalue";

type CounterValuesPairing<T> = *; // eslint-disable-line
type Histoday = *;

console.warn(
  "@ledgerhq/live-common/lib/api/countervalue is deprecated. switch to @ledgerhq/live-common/lib/countervalues"
);

const convertToCentPerSat = (
  from: Currency,
  to: Currency,
  value: number
): number => value * 10 ** (to.units[0].magnitude - from.units[0].magnitude);

/**
 * @memberof api/countervalue
 */
export async function fetchCurrentRates(
  currencies: Currency[],
  against: Currency
): Promise<CounterValuesPairing<{ latest: number }>> {
  const { data }: { data: mixed } = await axios.get(
    "https://min-api.cryptocompare.com/data/pricemulti?" +
      querystring.stringify({
        extraParams: "ledger-test",
        fsyms: currencies.map(c => c.ticker).join(","),
        tsyms: against.ticker
      })
  );
  const out = {};
  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (data && typeof data === "object") {
    Object.keys(data).forEach(ticker => {
      const currency = currencies.find(c => c.ticker === ticker);
      const map = data[ticker];
      if (currency && map && typeof map === "object") {
        const value = map[against.ticker];
        if (typeof value === "number") {
          out[ticker] = {
            [against.ticker]: {
              latest: convertToCentPerSat(currency, against, value)
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
 * TODO we will probably make the countervalue server returning this information
 */
export function getLatestDayAvailable(): string {
  const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
  return formatCounterValueDayUTC(oneDayAgo);
}

async function fetchOneHistodayRates(
  currency: Currency,
  against: Currency,
  getLatestDayFetched?: Currency => ?string = () => null
): Promise<CounterValuesPairing<Histoday>> {
  const latestDayFetched = getLatestDayFetched(currency);
  if (latestDayFetched && latestDayFetched === getLatestDayAvailable()) {
    return {};
  }
  // TODO later our API should accept from which date we want to pull
  const { data }: { data: mixed } = await axios.get(
    "https://min-api.cryptocompare.com/data/histoday?" +
      querystring.stringify({
        extraParams: "ledger-test",
        fsym: currency.ticker,
        tsym: against.ticker,
        allData: 1
      })
  );
  const out = {};

  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (data && typeof data === "object" && Array.isArray(data.Data)) {
    for (const item of data.Data) {
      if (!item || typeof item !== "object") continue;
      const { time, open } = item;
      if (typeof open !== "number" || typeof time !== "number") continue;
      // API gives a time at 00:00, we remove one second to format the day before because we want the close value of previous day.
      const day = formatCounterValueDayUTC(new Date(time * 1000 - 1000));
      out[day] = convertToCentPerSat(currency, against, open);
    }
  }

  return out;
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
  currencies: Currency[],
  against: Currency,
  getLatestDayFetched?: Currency => ?string = () => null
): Promise<CounterValuesPairing<Histoday>> {
  // NB in the future we want a single API call
  return Promise.all(
    currencies.map(currency =>
      fetchOneHistodayRates(currency, against, getLatestDayFetched)
    )
  ).then(all => {
    const data = {};
    all.forEach((histoday, i) => {
      const currency = currencies[i];
      // FIXME in future need to have currency.ticker
      data[currency.ticker] = {
        // FIXME same
        [against.ticker]: histoday
      };
    });
    return data;
  });
}
