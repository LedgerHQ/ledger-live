import React from "react";
import useCryptoViewModel from "./hooks/useCryptoViewModel";
import { CryptoAddressesView } from "./CryptoAddressesView";

export default function CryptoAddresses() {
  const viewModel = useCryptoViewModel();
  return <CryptoAddressesView viewModel={viewModel} />;
}
