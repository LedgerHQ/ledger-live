import React from "react";
import { BalanceTypeScreenInner } from "./components/BalanceTypeScreenInner";
import { FamilyBalanceTypeSync } from "./components/FamilyBalanceTypeSync";
import { useBalanceTypeScreenViewModel } from "./hooks/useBalanceTypeScreenViewModel";

export function BalanceTypeScreen() {
  const viewModel = useBalanceTypeScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  return (
    <>
      <BalanceTypeScreenInner viewModel={viewModel} />
      {viewModel.sync.isPending ? (
        <FamilyBalanceTypeSync
          onComplete={viewModel.sync.onComplete}
          onCancel={viewModel.sync.onCancel}
        />
      ) : null}
    </>
  );
}
