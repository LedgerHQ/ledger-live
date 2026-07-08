import React from "react";
import { LargeScreenUpsellModalPortfolioMountView } from "./LargeScreenUpsellModalPortfolioMountView";
import { useLargeScreenUpsellModalPortfolioMountViewModel } from "LLM/features/LargeScreenUpsellModal/screens/LargeScreenUpsellModalPortfolioMount/useLargeScreenUpsellModalPortfolioMountViewModel";

export function LargeScreenUpsellModalPortfolioMount() {
  const viewModel = useLargeScreenUpsellModalPortfolioMountViewModel();

  if (!viewModel) {
    return null;
  }

  return <LargeScreenUpsellModalPortfolioMountView {...viewModel} />;
}
