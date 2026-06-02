import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useBalanceGraphViewModel } from "./useBalanceGraphViewModel";
import { BalanceGraphView } from "./BalanceGraphView";

type Props = Readonly<{
  currency?: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
  hideReceive?: boolean;
  ledgerIds?: string[];
  distributionItem?: DistributionItem;
}>;

export function BalanceGraph({
  currency,
  marketApiId,
  knownLedgerIds,
  knownMarketId,
  hideReceive,
  ledgerIds,
  distributionItem,
}: Props) {
  const viewModel = useBalanceGraphViewModel({
    currency,
    marketApiId,
    knownLedgerIds,
    knownMarketId,
    hideReceive,
    ledgerIds,
    distributionItem,
  });
  return <BalanceGraphView {...viewModel} />;
}
