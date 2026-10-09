import React from "react";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { BalanceTypeScreenView } from "./components/BalanceTypeScreenView";
import { FamilyBalanceTypeSync } from "./components/FamilyBalanceTypeSync";
import { useBalanceTypeScreenViewModel } from "./hooks/useBalanceTypeScreenViewModel";

export function BalanceTypeScreen() {
  const viewModel = useBalanceTypeScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  return (
    <SendFlowLayout>
      {viewModel.sync.isPending ? (
        <FamilyBalanceTypeSync onComplete={viewModel.sync.onComplete} />
      ) : (
        <BalanceTypeScreenView viewModel={viewModel} />
      )}
    </SendFlowLayout>
  );
}
