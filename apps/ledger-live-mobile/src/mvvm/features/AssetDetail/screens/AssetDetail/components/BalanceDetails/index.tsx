import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useBalanceDetailsViewModel } from "./useBalanceDetailsViewModel";
import { BalanceDetailsView } from "./BalanceDetailsView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  distributionItem: DistributionItem | undefined;
}>;

export function BalanceDetails({ currency, distributionItem }: Props) {
  const viewModel = useBalanceDetailsViewModel(currency, distributionItem);
  return <BalanceDetailsView {...viewModel} />;
}
