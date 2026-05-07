import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAddressesViewModel } from "./useAddressesViewModel";
import { AddressesView } from "./AddressesView";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function Addresses({ currency }: Props) {
  const viewModel = useAddressesViewModel(currency);
  return <AddressesView {...viewModel} />;
}
