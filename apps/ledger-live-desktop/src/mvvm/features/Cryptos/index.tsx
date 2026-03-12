import React from "react";
import useCryptosViewModel from "./hooks/useCryptosViewModel";
import CryptosView from "./CryptosView";

export default function Cryptos() {
  const viewModel = useCryptosViewModel();
  return <CryptosView viewModel={viewModel} />;
}
