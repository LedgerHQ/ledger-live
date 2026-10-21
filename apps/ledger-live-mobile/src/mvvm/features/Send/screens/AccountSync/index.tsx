import React from "react";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { useAccountSyncScreenViewModel } from "./hooks/useAccountSyncScreenViewModel";

export function AccountSyncScreen() {
  const viewModel = useAccountSyncScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  const { SyncComponent, account, onComplete } = viewModel;

  return (
    <SendFlowLayout>
      <SyncComponent key={account.id} account={account} onComplete={onComplete} />
    </SendFlowLayout>
  );
}
