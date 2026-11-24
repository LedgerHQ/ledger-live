import React, { memo } from "react";
import { MarketCurrency } from "@ledgerhq/live-common/market/utils/types";
import { MarketRowView } from "./MarketRowView";
import { useMarketRowViewModel } from "./useMarketRowViewModel";

export type MarketRowProps = {
  size: number;
  start: number;
  currency: MarketCurrency;
  counterCurrency?: string;
  locale: string;
  range?: string;
  isStarred: boolean;
  toggleStar: (id: string, isStarred: boolean) => void;
};

export const MarketRow = memo<MarketRowProps>(function MarketRow(props: MarketRowProps) {
  const viewModel = useMarketRowViewModel(props);
  return <MarketRowView {...viewModel} />;
});
