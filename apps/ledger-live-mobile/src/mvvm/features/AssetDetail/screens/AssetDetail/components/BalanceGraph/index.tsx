import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useBalanceGraphViewModel } from "./useBalanceGraphViewModel";
import { BalanceGraphView } from "./BalanceGraphView";

export function BalanceGraph({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  const viewModel = useBalanceGraphViewModel(currency);
  return <BalanceGraphView {...viewModel} />;
}
