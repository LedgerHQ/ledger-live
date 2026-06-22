import React from "react";
import { CustomFeesScreenInner } from "./components/CustomFeesScreenInner";
import { useCustomFeesScreen } from "./hooks/useCustomFeesScreen";

export function CustomFeesScreen() {
  const viewModel = useCustomFeesScreen();

  if (!viewModel.ready) {
    return null;
  }

  return (
    <CustomFeesScreenInner
      account={viewModel.account}
      parentAccount={viewModel.parentAccount}
      transaction={viewModel.transaction}
      status={viewModel.status}
      transactionActions={viewModel.transactionActions}
      onConfirm={viewModel.onConfirm}
    />
  );
}
