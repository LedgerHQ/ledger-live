// @flow
import querystring from "querystring";
import type { Currency, Unit } from "../types";
import { formatCounterValueDay } from "../helpers/countervalue";

/**
 * nesting object map: crypto ticker -> fiat code -> Inner
 * e.g. CounterValuesPairing<number> can be { BTC: { USD: 1 } }
 */
export type CounterValuesPairing<Inner> = {
  [_: string]: { [_: string]: Inner }
};

/*
*/
export type Histoday = { [_: string]: number };

const convertToSatCent = (
  currency: Currency,
  fiatUnit: Unit,
  value: number
): number => value * 10 ** (fiatUnit.magnitude - currency.units[0].magnitude);

/**
 */
export async function fetchCurrentCounterValues(
  currencies: Currency[],
  fiatUnit: Unit
): Promise<CounterValuesPairing<number>> {
  const r = await fetch(
    "https://min-api.cryptocompare.com/data/pricemulti?" +
      querystring.stringify({
        extraParams: "ledger-test",
        fsyms: currencies.map(c => c.units[0].code).join(","),
        tsyms: fiatUnit.code
      })
  );
  const res: mixed = await r.json();
  const data = {};
  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (res && typeof res === "object") {
    Object.keys(res).forEach(ticker => {
      const currency = currencies.find(c => c.units[0].code === ticker);
      const map = res[ticker];
      if (currency && map && typeof map === "object") {
        const value = map[fiatUnit.code];
        if (typeof value === "number") {
          data[ticker] = {
            [fiatUnit.code]: convertToSatCent(currency, fiatUnit, value)
          };
        }
      }
    });
  }
  return data;
}

export async function fetchHistodayCounterValues(
  currency: Currency,
  fiatUnit: Unit
): Promise<Histoday> {
  const r = await fetch(
    "https://min-api.cryptocompare.com/data/pricemulti?" +
      querystring.stringify({
        extraParams: "ledger-test",
        fsym: currency.units[0].code,
        tsym: fiatUnit.code,
        allData: 1
      })
  );
  const res: mixed = await r.json();
  const data = {};

  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (res && typeof res === "object" && Array.isArray(res.Data)) {
    for (const item of res.Data) {
      if (!item || typeof item !== "object") continue;
      const { time, close } = item;
      if (typeof close !== "number" || typeof time !== "number") continue;
      const day = formatCounterValueDay(new Date(time * 1000));
      data[day] = convertToSatCent(currency, fiatUnit, close);
    }
  }

  return data;
}

/*
*/
export function fetchHistodayCounterValuesMultiple(
  currencies: Currency[],
  fiatUnit: Unit
): Promise<CounterValuesPairing<Histoday>> {
  return Promise.all(
    currencies.map(currency => fetchHistodayCounterValues(currency, fiatUnit))
  ).then(all => {
    const data = {};
    all.forEach((histoday, i) => {
      const currency = currencies[i];
      data[currency.units[0].code] = {
        [fiatUnit.code]: histoday
      };
    });
    return data;
  });
}
