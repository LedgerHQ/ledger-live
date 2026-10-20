import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useBalanceDetailsViewModel } from "./useBalanceDetailsViewModel";
import { BalanceDetailsView } from "./BalanceDetailsView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  distributionItem: DistributionItem | undefined;
  isLoading: boolean;
  ledgerIds: string[];
}>;

export function BalanceDetails({ currency, distributionItem, isLoading, ledgerIds }: Props) {
  const viewModel = useBalanceDetailsViewModel(currency, distributionItem, ledgerIds);
  return (
    <BalanceDetailsView {...viewModel} distributionItem={distributionItem} isLoading={isLoading} />
  );
}
