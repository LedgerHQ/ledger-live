import React from "react";
import { CoinControlScreenInner } from "./components/CoinControlScreenInner";
import { useCoinControlScreen } from "./hooks/useCoinControlView";

export function CoinControlScreen() {
  const viewModel = useCoinControlScreen();

  if (!viewModel.ready) {
    return null;
  }

  return (
    <CoinControlScreenInner
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
