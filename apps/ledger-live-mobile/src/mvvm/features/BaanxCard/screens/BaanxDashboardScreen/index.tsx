import React from "react";
import BaanxDashboardScreenView from "./BaanxDashboardScreenView";
import { useBaanxDashboardViewModel } from "./useBaanxDashboardViewModel";

export const BaanxDashboardScreen = () => {
  const viewModel = useBaanxDashboardViewModel();

  return (
    <BaanxDashboardScreenView
      card={viewModel.cardStatus.data ?? undefined}
      cardLoading={viewModel.cardStatus.isLoading}
      cardError={viewModel.cardStatus.error ? String(viewModel.cardStatus.error) : null}
      transactions={viewModel.transactions.data ?? []}
      txLoading={viewModel.transactions.isLoading}
      txError={viewModel.transactions.error ? String(viewModel.transactions.error) : null}
      onLogout={viewModel.logout}
    />
  );
};
