import React from "react";
import { useMarketCapCardViewModel } from "./useMarketCapCardViewModel";
import { MarketCapCardView } from "./MarketCapCardView";
import type { MarketCapCardProps } from "./types";

export function MarketCapCard({ width }: MarketCapCardProps) {
  const viewModel = useMarketCapCardViewModel();
  return <MarketCapCardView {...viewModel} width={width} />;
}
