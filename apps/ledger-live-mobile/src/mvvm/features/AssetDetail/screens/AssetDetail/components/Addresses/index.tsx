import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useAddressesViewModel } from "./useAddressesViewModel";
import { AddressesView } from "./AddressesView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  distributionItem: DistributionItem | undefined;
  isLoading: boolean;
}>;

export function Addresses({ currency, distributionItem, isLoading }: Props) {
  const viewModel = useAddressesViewModel(currency, distributionItem);
  return <AddressesView {...viewModel} isLoading={isLoading} />;
}
