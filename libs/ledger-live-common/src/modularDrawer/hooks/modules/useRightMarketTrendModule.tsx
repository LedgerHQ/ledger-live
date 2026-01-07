import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useMarketByCurrencies } from "../../../dada-client/hooks/useMarketByCurrencies";
import counterValueFormatter from "../../../market/utils/countervalueFormatter";
import { UseBalanceDeps } from "../../utils/type";

const createMarketPriceItem = ({
  price,
  percent,
  MarketPriceIndicator,
}: {
  price: string;
  percent: number;
  MarketPriceIndicator: React.ComponentType<{ percent: number; price: string }>;
}) => <MarketPriceIndicator percent={percent} price={price} />;

export const useRightMarketTrendModule = ({
  currencies,
  useBalanceDeps,
  MarketPriceIndicator,
  enabled = true,
}: {
  currencies: CryptoOrTokenCurrency[];
  useBalanceDeps: UseBalanceDeps;
  MarketPriceIndicator: React.ComponentType<{ percent: number; price: string }>;
  enabled?: boolean;
}) => {
  const marketByCurrencies = useMarketByCurrencies(currencies);
  const { counterValueCurrency, locale } = useBalanceDeps();

  return useMemo(() => {
    if (!enabled) return currencies;

    return currencies.map(currency => {
      const currencyMarket = marketByCurrencies[currency.id];

      if (
        !currencyMarket ||
        currencyMarket.priceChangePercentage24h === undefined ||
        currencyMarket.price === undefined
      ) {
        return currency;
      }

      const priceFormatted = counterValueFormatter({
        value: currencyMarket.price,
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
    counterValueCurrency.ticker,
    locale,
    MarketPriceIndicator,
    enabled,
  ]);
};
