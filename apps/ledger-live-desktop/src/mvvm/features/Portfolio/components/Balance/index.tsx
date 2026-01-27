import React from "react";
import { useBalanceViewModel } from "../../hooks/useBalanceViewModel";
import { BalanceView } from "./BalanceView";

export const Balance = () => {
  const viewModel = useBalanceViewModel();

  return <BalanceView {...viewModel} />;
};
