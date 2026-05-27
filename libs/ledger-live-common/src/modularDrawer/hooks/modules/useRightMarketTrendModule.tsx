import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { roundFiatPrice } from "@ledgerhq/live-currency-format";
import { useMarketByCurrencies } from "../../../dada-client/hooks/useMarketByCurrencies";
import counterValueFormatter from "../../../market/utils/countervalueFormatter";
import { useUsdToFiatRate } from "../../../counterValues/hooks/useUsdToFiatRate";
import { AssetConfigurationOptions } from "../../utils/type";

const createMarketPriceItem = ({
  price,
  percent,
  MarketPriceIndicator,
}: {
  price: string;
  percent: number;
  MarketPriceIndicator: React.ComponentType<{ percent: number; price: string }>;
}) => <MarketPriceIndicator percent={percent} price={price} />;

export const useRightMarketTrendModule = (
  currencies: CryptoOrTokenCurrency[],
  {
    useBalanceDeps,
    MarketPriceIndicator,
  }: Pick<AssetConfigurationOptions, "useBalanceDeps" | "MarketPriceIndicator">,
) => {
  const marketByCurrencies = useMarketByCurrencies(currencies);
  const { counterValueCurrency, locale } = useBalanceDeps();
  const { status, rate } = useUsdToFiatRate(counterValueCurrency.ticker);

  return useMemo(() => {
    return currencies.map(currency => {
      const currencyMarket = marketByCurrencies[currency.id];

      if (
        !currencyMarket ||
        currencyMarket.priceChangePercentage24h === undefined ||
        currencyMarket.price === undefined ||
        status !== "ready" ||
        rate == null
      ) {
        return currency;
      }

      const priceFormatted = counterValueFormatter({
        value: roundFiatPrice(currencyMarket.price * rate),
        currency: counterValueCurrency.ticker,
        locale,
      });

      return {
        ...currency,
        rightElement: createMarketPriceItem({
          percent: currencyMarket.priceChangePercentage24h,
          price: priceFormatted,
          MarketPriceIndicator,
        }),
      };
    });
  }, [
    currencies,
    marketByCurrencies,
    status,
    rate,
    counterValueCurrency.ticker,
    locale,
    MarketPriceIndicator,
  ]);
};
