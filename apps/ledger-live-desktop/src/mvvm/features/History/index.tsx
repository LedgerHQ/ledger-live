import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import HistoryPageHeader from "./components/HistoryPageHeader";
import useHistoryViewModel, { HistoryViewModel } from "./useHistoryViewModel";
import { OperationsList } from "~/renderer/components/OperationsList";

export default function History() {
  const viewModel = useHistoryViewModel();
  return <HistoryView viewModel={viewModel} />;
}

function HistoryView({ viewModel }: { readonly viewModel: HistoryViewModel }) {
  const { navigateToDashboard, accounts, filterOperations, t } = viewModel;
  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="History" />
      <HistoryPageHeader onBack={navigateToDashboard} />
      <OperationsList
        accounts={accounts}
        title={t("dashboard.recentActivity")}
        withAccount
        withSubAccounts
        filterOperation={filterOperations}
        t={t}
        isWallet40
      />
    </div>
  );
}
