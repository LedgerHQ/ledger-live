import React from "react";
import { StocksSectionView } from "./StocksSectionView";
import { useStocksSectionViewModel } from "./hooks/useStocksSectionViewModel";
import { StocksHeaderVariant } from "./types";

type StocksProps = {
  limit: number;
  navigateToAsset: (currencyId: string) => void;
  onSeeAll: () => void;
  headerVariant?: StocksHeaderVariant;
};

const Stocks = ({ limit, navigateToAsset, onSeeAll, headerVariant }: StocksProps) => (
  <StocksSectionView
    {...useStocksSectionViewModel({ limit })}
    limit={limit}
    navigateToAsset={navigateToAsset}
    onSeeAll={onSeeAll}
    headerVariant={headerVariant}
  />
);

export default Stocks;
