import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useMarketStatsViewModel } from "./useMarketStatsViewModel";
import { MarketStatsView } from "./MarketStatsView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
}>;

export function MarketStats({ currency, marketApiId, knownLedgerIds, knownMarketId }: Props) {
  const viewModel = useMarketStatsViewModel({
    currency,
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });
  return <MarketStatsView {...viewModel} />;
}
