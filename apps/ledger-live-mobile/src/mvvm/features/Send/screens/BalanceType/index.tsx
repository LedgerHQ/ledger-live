import React from "react";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { BalanceTypeSyncSheet } from "../BalanceTypeSync";
import { BalanceTypeScreenView } from "./components/BalanceTypeScreenView";
import { useBalanceTypeScreenViewModel } from "./hooks/useBalanceTypeScreenViewModel";

export function BalanceTypeScreen() {
  const viewModel = useBalanceTypeScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  return (
    <SendFlowLayout>
      <BalanceTypeScreenView viewModel={viewModel} />
      <BalanceTypeSyncSheet {...viewModel.sync} />
    </SendFlowLayout>
  );
}
