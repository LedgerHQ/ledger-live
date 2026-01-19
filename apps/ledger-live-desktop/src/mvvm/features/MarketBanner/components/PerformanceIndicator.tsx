import React from "react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

type PerformanceIndicatorProps = {
  value: Pick<MarketItemPerformer, "priceChangePercentage24h">;
};

export const PerformanceIndicator = ({ value }: PerformanceIndicatorProps) => {
  const textColorClass = value.priceChangePercentage24h >= 0 ? "text-success" : "text-error";

  return (
    <div className={`${textColorClass} body-2-semi-bold`}>
      {value.priceChangePercentage24h >= 0 ? "+" : ""}
      {value.priceChangePercentage24h.toFixed(2)}%
    </div>
  );
};
