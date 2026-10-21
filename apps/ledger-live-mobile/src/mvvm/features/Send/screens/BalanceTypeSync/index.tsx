import React from "react";
import { SendFlowLayout } from "../../components/SendFlowLayout";
import { useBalanceTypeSyncScreenViewModel } from "./hooks/useBalanceTypeSyncScreenViewModel";

export function BalanceTypeSyncScreen() {
  const viewModel = useBalanceTypeSyncScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  const { SyncComponent, account, transaction, onComplete, onClose } = viewModel;

  return (
    <SendFlowLayout>
      <SyncComponent
        key={account.id}
        account={account}
        transaction={transaction}
        onComplete={onComplete}
        onClose={onClose}
      />
    </SendFlowLayout>
  );
}
