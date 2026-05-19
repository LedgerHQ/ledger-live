import React from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { MarketStats } from "./MarketStats";
import { PricePerformance } from "./PricePerformance";
import { useMarketDataSectionCurrencyData } from "./hooks/useMarketDataSectionCurrencyData";

type MarketDataSectionProps = Readonly<{
  marketData: AssetMarketData;
}>;

export function MarketDataSection({ marketData }: MarketDataSectionProps) {
  const currencyData = useMarketDataSectionCurrencyData(marketData);

  return (
    <div className="grid grid-cols-2 gap-24" data-testid="asset-detail-market-data-section">
      <MarketStats currencyData={currencyData} />
      <PricePerformance currencyData={currencyData} />
    </div>
  );
}
