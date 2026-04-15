import React from "react";
import BaanxDashboardScreenView from "./BaanxDashboardScreenView";
import { useBaanxDashboardViewModel } from "./useBaanxDashboardViewModel";

export const BaanxDashboardScreen = () => {
  const viewModel = useBaanxDashboardViewModel();
  return <BaanxDashboardScreenView {...viewModel} />;
};
