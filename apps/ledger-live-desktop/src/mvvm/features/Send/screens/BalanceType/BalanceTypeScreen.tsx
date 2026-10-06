import React from "react";
import { BalanceTypeScreenInner } from "./components/BalanceTypeScreenInner";
import { FamilyBalanceTypeSync } from "./components/FamilyBalanceTypeSync";
import { useBalanceTypeScreenViewModel } from "./hooks/useBalanceTypeScreenViewModel";

export function BalanceTypeScreen() {
  const viewModel = useBalanceTypeScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  if (viewModel.sync.isPending) {
    return (
      <FamilyBalanceTypeSync
        onComplete={viewModel.sync.onComplete}
        onCancel={viewModel.sync.onCancel}
      />
    );
  }

  return <BalanceTypeScreenInner viewModel={viewModel} />;
}
