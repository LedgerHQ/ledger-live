import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useMarketByCurrencies } from "../../../dada-client/hooks/useMarketByCurrencies";
import { AssetConfigurationOptions } from "../../utils/type";

const createMarketTrendItem = ({
  percent,
  MarketPercentIndicator,
}: {
  percent: number;
  MarketPercentIndicator: React.ComponentType<{ percent: number }>;
}) => <MarketPercentIndicator percent={percent} />;

export const useLeftMarketTrendModule = (
  currencies: CryptoOrTokenCurrency[],
  { MarketPercentIndicator }: Pick<AssetConfigurationOptions, "MarketPercentIndicator">,
) => {
  const marketByCurrencies = useMarketByCurrencies(currencies);

  return useMemo(() => {
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
  }, [currencies, marketByCurrencies, MarketPercentIndicator]);
};
