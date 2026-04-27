import React from "react";
import { ProductTourPortfolioMountView } from "./ProductTourPortfolioMountView";
import { useProductTourPortfolioMountViewModel } from "./useProductTourPortfolioMountViewModel";

export const ProductTourPortfolioMount = () => {
  const viewModel = useProductTourPortfolioMountViewModel();
  return <ProductTourPortfolioMountView {...viewModel} />;
};
