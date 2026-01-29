import React from "react";
import { useBalanceViewModel } from "../../hooks/useBalanceViewModel";
import { BalanceView } from "./BalanceView";
import { NoBalanceView } from "./NoBalanceView";

export const Balance = () => {
  const { hasFunds, ...viewModel } = useBalanceViewModel();

  return hasFunds ? <BalanceView {...viewModel} /> : <NoBalanceView />;
};
