import type { AssetsData } from "../types";

/** The zero value of an aggregated-assets response: every collection present but empty. */
export function emptyAssetsData(): AssetsData {
  return {
    cryptoAssets: {},
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
  };
}
