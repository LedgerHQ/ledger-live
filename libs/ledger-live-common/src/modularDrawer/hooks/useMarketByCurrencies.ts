import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectMarketByCurrency } from "../data/entities/marketSelectors";

export const useMarketByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  return useSelector(state => {
    const marketByCurrencies: Record<
      string,
      { price?: number; priceChangePercentage24h?: number }
    > = {};
    currencies.forEach(currency => {
      const currencyMarket = selectMarketByCurrency(state, currency.id);
      if (
        currencyMarket &&
        currencyMarket.price !== undefined &&
        currencyMarket.priceChangePercentage24h !== undefined
      ) {
        marketByCurrencies[currency.id] = {
          ...(currencyMarket.price && { price: currencyMarket.price }),
          ...(currencyMarket.priceChangePercentage24h && {
            priceChangePercentage24h:
              Math.round(currencyMarket.priceChangePercentage24h * 100) / 100,
          }),
        };
      }
    });
    return marketByCurrencies;
  });
};
