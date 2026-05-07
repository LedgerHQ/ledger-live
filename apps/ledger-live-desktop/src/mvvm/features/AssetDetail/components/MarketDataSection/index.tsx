import React from "react";
import { MarketStats } from "./MarketStats";
import { PricePerformance } from "./PricePerformance";

export function MarketDataSection() {
  return (
    <div className="grid grid-cols-2 gap-24" data-testid="asset-detail-market-data-section">
      <MarketStats />
      <PricePerformance />
    </div>
  );
}
