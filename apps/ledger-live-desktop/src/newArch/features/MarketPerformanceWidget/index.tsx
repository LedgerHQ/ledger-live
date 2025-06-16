import React from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { MarketPerformanceWidgetContainer } from "./components/Container";
import { useMarketPerformanceWidget } from "./useMarketPerformanceWidget";

type Props = {
  variant: ABTestingVariants;
};

const MarketPerformanceWidget = ({ variant }: Props) => {
  return <MarketPerformanceWidgetContainer variant={variant} {...useMarketPerformanceWidget()} />;
};

export default React.memo(MarketPerformanceWidget);
