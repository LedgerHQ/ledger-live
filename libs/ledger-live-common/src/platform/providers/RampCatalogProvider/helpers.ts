import { uniq, flatten } from "lodash";
import { QueryParams, RampCatalogEntry, RampLiveAppCatalogEntry } from "./types";

export type RampFilters = {
  fiatCurrencies?: string[];
  cryptoCurrencies?: string[];
  paymentProviders?: string[];
  tickers?: string[];
};

function filterArray(array: string[], filters: string[]) {
  return filters.every(filter => array.includes(filter));
}

export function mapQueryParamsForProvider(
  entry: RampLiveAppCatalogEntry,
  params: QueryParams,
): QueryParams {
  const result = {};

  const keys = Object.keys(params);
  keys.forEach(key => {
    const providerKey = entry.paramsMapping[key];
    const providerValue = params[key];

    if (providerKey && providerValue) {
      result[providerKey] = providerValue;
    }
  });
  return result;
}

export function filterRampCatalogEntries(
  entries: RampCatalogEntry[],
  filters: RampFilters,
): RampCatalogEntry[] {
  return entries.filter(entry => {
    if (
      filters.cryptoCurrencies &&
      !filterArray(
        entry.cryptoCurrencies.map(entry => entry.id),
        filters.cryptoCurrencies,
      )
    ) {
      return false;
    }

    if (filters.fiatCurrencies && !filterArray(entry.fiatCurrencies, filters.fiatCurrencies)) {
      return false;
    }

    if (
      filters.paymentProviders &&
      !filterArray(entry.paymentProviders, filters.paymentProviders)
    ) {
      return false;
    }

    if (
      filters.tickers &&
      !filterArray(
        entry.cryptoCurrencies.map(entry => entry.ticker.toLowerCase()),
        filters.tickers.map(ticker => ticker.toLowerCase()),
      )
    ) {
      return false;
    }
    return true;
  });
}

export function getAllSupportedCryptoCurrencyIds(entries: RampCatalogEntry[]): string[] {
  return uniq(flatten(entries.map(entry => entry.cryptoCurrencies.map(entry => entry.id))));
}

export function getAllSupportedCryptoCurrencyTickers(entries: RampCatalogEntry[]): string[] {
  return uniq(flatten(entries.map(entry => entry.cryptoCurrencies.map(entry => entry.ticker))));
}
