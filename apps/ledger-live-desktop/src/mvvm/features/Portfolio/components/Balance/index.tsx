import React from "react";
import { useBalanceViewModel } from "../../hooks/useBalanceViewModel";
import { BalanceView } from "./BalanceView";
import { NoBalanceView } from "./NoBalanceView";
import { NoDeviceView } from "./NoDeviceView";

export const Balance = () => {
  const { hasCompletedOnboarding, hasAccount, ...viewModel } = useBalanceViewModel();

  if (!hasCompletedOnboarding) {
    return <NoDeviceView />;
  }

  if (!hasAccount) {
    return <NoBalanceView />;
  }

  return <BalanceView {...viewModel} />;
};
