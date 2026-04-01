import React from "react";
import useCryptoAddressesViewModel from "./hooks/useCryptoAddressesViewModel";
import { CryptoAddressesView } from "./CryptoAddressesView";

export default function CryptoAddresses() {
  const viewModel = useCryptoAddressesViewModel();
  return <CryptoAddressesView viewModel={viewModel} />;
}
