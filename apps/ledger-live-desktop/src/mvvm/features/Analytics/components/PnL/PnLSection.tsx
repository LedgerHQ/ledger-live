import React from "react";
import { PnLSection as SharedPnLSection } from "LLD/features/PnL/components/PnLSection";
import { usePortfolioPnlViewModel } from "./usePortfolioPnlViewModel";

export function PnLSection() {
  const viewModel = usePortfolioPnlViewModel();
  return <SharedPnLSection viewModel={viewModel} direction="row" />;
}
