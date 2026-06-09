import React from "react";
import { StocksSectionView } from "./StocksSectionView";
import { useStocksSectionViewModel } from "./hooks/useStocksSectionViewModel";

type StocksProps = {
  limit: number;
  navigateToAsset: (currencyId: string) => void;
  onSeeAll: () => void;
};

const Stocks = ({ limit, navigateToAsset, onSeeAll }: StocksProps) => (
  <StocksSectionView
    {...useStocksSectionViewModel({ limit })}
    limit={limit}
    navigateToAsset={navigateToAsset}
    onSeeAll={onSeeAll}
  />
);

export default Stocks;
