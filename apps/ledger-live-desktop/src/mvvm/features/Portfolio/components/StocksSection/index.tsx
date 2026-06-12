import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import Stocks from "LLD/features/Stocks";
import { AssetSection } from "LLD/features/Assets/components/AssetsSection";
import { useStocksSectionViewModel } from "./useStocksSectionViewModel";
import { usePortfolioStocksViewModel } from "./usePortfolioStocksViewModel";

const STOCKS_PORTFOLIO_LIMIT = 20;

export const StocksSection = () => {
  const { navigateToAsset, onSeeAll } = useStocksSectionViewModel();
  const { isLoading, stocksCount, section } = usePortfolioStocksViewModel();

  if (isLoading) {
    return <Skeleton component="table" />;
  }

  if (stocksCount > 0) {
    return <AssetSection {...section} />;
  }

  return (
    <Stocks
      limit={STOCKS_PORTFOLIO_LIMIT}
      headerVariant="explore"
      navigateToAsset={navigateToAsset}
      onSeeAll={onSeeAll}
    />
  );
};
