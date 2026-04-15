import React from "react";
import { useBaanxAuth } from "../../Navigator";
import BaanxDashboardScreenView from "./BaanxDashboardScreenView";
import { useBaanxDashboardViewModel } from "./useBaanxDashboardViewModel";

export const BaanxDashboardScreen = () => {
  const { accessToken } = useBaanxAuth();
  const viewModel = useBaanxDashboardViewModel(accessToken ?? undefined);
  return <BaanxDashboardScreenView {...viewModel} />;
};
