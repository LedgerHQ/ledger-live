import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectMarketByCurrency } from "../entities/marketSelectors";
import { ApiState } from "../entities/selectorUtils";

export const useMarketByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  const marketSelector = useMemo(() => {
    return createSelector(
      [
        (state: ApiState) => state,
        (_state: ApiState, currencies: CryptoOrTokenCurrency[]) => currencies,
      ],
      (state, currencies) => {
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
              price: currencyMarket.price,
              priceChangePercentage24h:
                Math.round(currencyMarket.priceChangePercentage24h * 100) / 100,
            };
          }
        }
        return marketByCurrencies;
      },
    );
  }, []);

  return useSelector((state: ApiState) => marketSelector(state, currencies));
};
