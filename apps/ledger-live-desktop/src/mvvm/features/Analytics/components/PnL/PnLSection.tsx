import React from "react";
import { PnLSection as SharedPnLSection } from "LLD/features/PnL/components/PnLSection";
import { PnlSubHeader } from "../PnlSubHeader";
import { usePortfolioPnlViewModel } from "./usePortfolioPnlViewModel";

export function PnLSection() {
  const viewModel = usePortfolioPnlViewModel();

  if (!viewModel.shouldDisplayPnl) return null;

  return (
    <div className="flex flex-col gap-12">
      <PnlSubHeader onDetailClick={viewModel.dialog.onOpen} />
      <SharedPnLSection viewModel={viewModel} direction="row" />
    </div>
  );
}
