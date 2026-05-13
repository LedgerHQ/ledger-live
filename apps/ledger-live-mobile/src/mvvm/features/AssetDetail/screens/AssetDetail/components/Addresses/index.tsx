import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useAddressesViewModel } from "./useAddressesViewModel";
import { AddressesView } from "./AddressesView";

export function Addresses({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  const viewModel = useAddressesViewModel(currency);
  return <AddressesView {...viewModel} />;
}
