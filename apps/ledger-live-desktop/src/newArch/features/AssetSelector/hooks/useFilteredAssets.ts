import { useMemo } from "react";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets";
import { Asset } from "../types";

export const useFilteredAssets = (searchQuery: string): Asset[] => {
  const currencies = useMemo(() => listCryptoCurrencies(), []);

  return useMemo(() => {
    const assets: Asset[] = currencies.map(currency => ({
      id: currency.id,
      name: currency.name,
      ticker: currency.ticker,
      currency,
    }));

    if (!searchQuery) {
      return assets;
    }

    const query = searchQuery.toLowerCase();
    return assets.filter(
      asset =>
        asset.name.toLowerCase().includes(query) || asset.ticker.toLowerCase().includes(query),
    );
  }, [currencies, searchQuery]);
};
