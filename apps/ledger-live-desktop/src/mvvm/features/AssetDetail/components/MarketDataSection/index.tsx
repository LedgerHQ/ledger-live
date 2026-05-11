import React from "react";
import { MarketStats } from "./MarketStats";
import { PricePerformance } from "./PricePerformance";
import { MarketDataSectionCurrencyProvider } from "./MarketDataSectionCurrencyContext";
import { useMarketDataSectionCurrencyData } from "./hooks/useMarketDataSectionCurrencyData";

type MarketDataSectionProps = Readonly<{
  currencyQueryId: string | undefined;
}>;

export function MarketDataSection({ currencyQueryId }: MarketDataSectionProps) {
  const currencyData = useMarketDataSectionCurrencyData(currencyQueryId);

  return (
    <MarketDataSectionCurrencyProvider value={currencyData}>
      <div className="grid grid-cols-2 gap-24" data-testid="asset-detail-market-data-section">
        <MarketStats />
        <PricePerformance />
      </div>
    </MarketDataSectionCurrencyProvider>
  );
}
