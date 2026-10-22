import React from "react";
import { useBalanceTypeSyncScreenViewModel } from "./hooks/useBalanceTypeSyncScreenViewModel";

export function BalanceTypeSyncScreen() {
  const { SendBalanceTypeSync, account, transaction, onComplete, onClose } =
    useBalanceTypeSyncScreenViewModel();

  if (!SendBalanceTypeSync || !account || !transaction) return null;

  return (
    <SendBalanceTypeSync
      account={account}
      transaction={transaction}
      onComplete={onComplete}
      onClose={onClose}
    />
  );
}
