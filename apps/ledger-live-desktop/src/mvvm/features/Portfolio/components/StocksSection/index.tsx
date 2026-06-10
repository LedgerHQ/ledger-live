import React from "react";
import Stocks from "LLD/features/Stocks";
import { useStocksSectionViewModel } from "./useStocksSectionViewModel";

const STOCKS_PORTFOLIO_LIMIT = 20;

export const StocksSection = () => {
  const { navigateToAsset, onSeeAll } = useStocksSectionViewModel();

  return (
    <Stocks
      limit={STOCKS_PORTFOLIO_LIMIT}
      headerVariant="explore"
      navigateToAsset={navigateToAsset}
      onSeeAll={onSeeAll}
    />
  );
};
