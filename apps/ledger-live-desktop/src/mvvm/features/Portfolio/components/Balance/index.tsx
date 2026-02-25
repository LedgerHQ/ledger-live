import React from "react";
import { useBalanceViewModel } from "../../hooks/useBalanceViewModel";
import { BalanceView } from "./BalanceView";
import { NoBalanceView } from "./NoBalanceView";
import { NoDeviceView } from "./NoDeviceView";

export const Balance = () => {
  const { hasOnboardedDevice, hasAccount, ...viewModel } = useBalanceViewModel();

  if (!hasOnboardedDevice) {
    return <NoDeviceView />;
  }

  if (!hasAccount) {
    return <NoBalanceView />;
  }

  return <BalanceView {...viewModel} />;
};
