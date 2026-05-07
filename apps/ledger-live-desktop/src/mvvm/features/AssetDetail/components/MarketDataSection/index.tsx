import React from "react";
import { MarketStats } from "./MarketStats";
import { PricePerformance } from "./PricePerformance";
import { useMarketDataSectionCurrencyData } from "./hooks/useMarketDataSectionCurrencyData";

type MarketDataSectionProps = Readonly<{
  currencyQueryId: string | undefined;
}>;

export function MarketDataSection({ currencyQueryId }: MarketDataSectionProps) {
  const currencyData = useMarketDataSectionCurrencyData(currencyQueryId);

  return (
    <div className="grid grid-cols-2 gap-24" data-testid="asset-detail-market-data-section">
      <MarketStats currencyData={currencyData} />
      <PricePerformance currencyData={currencyData} />
    </div>
  );
}
