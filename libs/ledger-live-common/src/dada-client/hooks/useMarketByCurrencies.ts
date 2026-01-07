import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectMarketByCurrency } from "../entities/marketSelectors";
import { ApiState } from "../entities/selectorUtils";

export const useMarketByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  return useSelector((state: ApiState) => {
    const marketByCurrencies: Record<
      string,
      { price?: number; priceChangePercentage24h?: number }
    > = {};
    for (const currency of currencies) {
      const currencyMarket = selectMarketByCurrency(state, currency.id);
      if (
        currencyMarket?.price !== undefined &&
        currencyMarket?.priceChangePercentage24h !== undefined
      ) {
        marketByCurrencies[currency.id] = {
          ...(currencyMarket.price && { price: currencyMarket.price }),
          ...(currencyMarket.priceChangePercentage24h && {
            priceChangePercentage24h:
              Math.round(currencyMarket.priceChangePercentage24h * 100) / 100,
          }),
        };
      }
    }
    return marketByCurrencies;
  });
};
