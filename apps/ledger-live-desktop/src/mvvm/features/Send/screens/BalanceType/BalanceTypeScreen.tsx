import React from "react";
import { BalanceTypeScreenInner } from "./components/BalanceTypeScreenInner";
import { useBalanceTypeScreenViewModel } from "./hooks/useBalanceTypeScreenViewModel";

export function BalanceTypeScreen() {
  const viewModel = useBalanceTypeScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  return <BalanceTypeScreenInner viewModel={viewModel} />;
}
