import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useBalanceDetailsViewModel } from "./useBalanceDetailsViewModel";
import { BalanceDetailsView } from "./BalanceDetailsView";

export function BalanceDetails({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  const viewModel = useBalanceDetailsViewModel(currency);
  return <BalanceDetailsView {...viewModel} />;
}
