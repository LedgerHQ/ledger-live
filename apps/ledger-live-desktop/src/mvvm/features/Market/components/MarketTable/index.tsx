import React from "react";
import { MarketTableData, useMarketTableViewModel } from "./useMarketTableViewModel";
import { MarketTableView } from "./MarketTableView";

export default function MarketTable(props: Readonly<MarketTableData>) {
  const viewModel = useMarketTableViewModel(props);
  return <MarketTableView {...viewModel} />;
}
