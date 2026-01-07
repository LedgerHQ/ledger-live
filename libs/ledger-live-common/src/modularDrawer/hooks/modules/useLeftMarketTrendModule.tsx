import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useMarketByCurrencies } from "../../../dada-client/hooks/useMarketByCurrencies";

const createMarketTrendItem = ({
  percent,
  MarketPercentIndicator,
}: {
  percent: number;
  MarketPercentIndicator: React.ComponentType<{ percent: number }>;
}) => <MarketPercentIndicator percent={percent} />;

export const useLeftMarketTrendModule = (
  currencies: CryptoOrTokenCurrency[],
  MarketPercentIndicator: React.ComponentType<{ percent: number }>,
  enabled = true,
) => {
  const marketByCurrencies = useMarketByCurrencies(currencies);

  return useMemo(() => {
    if (!enabled) return currencies;

    return currencies.map(currency => {
      const currencyMarket = marketByCurrencies[currency.id];

      if (!currencyMarket || currencyMarket.priceChangePercentage24h === undefined) {
        return currency;
      }

      return {
        ...currency,
        leftElement: createMarketTrendItem({
          percent: currencyMarket.priceChangePercentage24h,
          MarketPercentIndicator,
        }),
      };
    });
  }, [currencies, marketByCurrencies, MarketPercentIndicator, enabled]);
};
