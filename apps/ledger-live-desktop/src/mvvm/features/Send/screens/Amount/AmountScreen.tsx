import React from "react";
import { AmountScreenInner } from "./components/AmountScreenInner";
import { useAmountScreen } from "./hooks/useAmountScreen";

export function AmountScreen() {
  const viewModel = useAmountScreen();

  if (!viewModel.ready) {
    return null;
  }

  return (
    <AmountScreenInner
      account={viewModel.account}
      parentAccount={viewModel.parentAccount}
      transaction={viewModel.transaction}
      status={viewModel.status}
      bridgePending={viewModel.bridgePending}
      bridgeError={viewModel.bridgeError}
      uiConfig={viewModel.uiConfig}
      transactionActions={viewModel.transactionActions}
      onReview={viewModel.onReview}
      onGetFunds={viewModel.onGetFunds}
    />
  );
}
