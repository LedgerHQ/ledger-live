import React from "react";
import { USE_ACCOUNT_DATA_OPERATIONS } from "./constants";
import { AccountOperationsQueries } from "./components/AccountOperationsQueries";
import { HistoryView } from "./HistoryView";
import { useCardHistoryViewModel } from "./components/CardHistory/useCardHistoryViewModel";
import { useAccountDataHistoryOperations } from "./hooks/useAccountDataHistoryOperations";
import { useHistoryOperations } from "./hooks/useHistoryOperations";
import { useHistoryViewModel } from "./hooks/useHistoryViewModel";
import type { OperationTableItem } from "./types";

function HistoryScreen({
  operations,
  pending,
}: Readonly<{ operations: OperationTableItem[]; pending: boolean }>) {
  const viewModel = useHistoryViewModel(operations, pending);
  const cardHistoryViewModel = useCardHistoryViewModel();

  return <HistoryView {...viewModel} cardHistoryViewModel={cardHistoryViewModel} />;
}

function LegacyHistory() {
  const operations = useHistoryOperations();
  return <HistoryScreen operations={operations} pending={false} />;
}

function AccountDataHistory() {
  const { operations, targets, pending } = useAccountDataHistoryOperations();
  return (
    <>
      <AccountOperationsQueries targets={targets} />
      <HistoryScreen operations={operations} pending={pending} />
    </>
  );
}

const History = () => (USE_ACCOUNT_DATA_OPERATIONS ? <AccountDataHistory /> : <LegacyHistory />);

export default History;
