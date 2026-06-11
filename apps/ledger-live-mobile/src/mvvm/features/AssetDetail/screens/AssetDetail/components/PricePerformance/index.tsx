import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { usePricePerformanceViewModel } from "./usePricePerformanceViewModel";
import { PricePerformanceView } from "./PricePerformanceView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
}>;

export function PricePerformance({ currency, marketApiId, knownLedgerIds, knownMarketId }: Props) {
  const viewModel = usePricePerformanceViewModel({
    currency,
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });
  return <PricePerformanceView {...viewModel} />;
}
