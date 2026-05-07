import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useBalanceGraphViewModel } from "./useBalanceGraphViewModel";
import { BalanceGraphView } from "./BalanceGraphView";

type Props = Readonly<{
  currency?: AssetDetailCurrencyProps;
  hideReceive?: boolean;
}>;

export function BalanceGraph({ currency, hideReceive }: Props) {
  const viewModel = useBalanceGraphViewModel(currency, hideReceive);
  return <BalanceGraphView {...viewModel} />;
}
