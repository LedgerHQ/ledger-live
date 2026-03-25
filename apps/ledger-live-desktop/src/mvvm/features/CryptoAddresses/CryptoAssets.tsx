import React from "react";
import { CryptoAssetsView } from "./CryptoAssetsView";
import useCryptoAssetsViewModel from "./hooks/useCryptoAssetsViewModel";

export default function CryptoAssets() {
  const viewModel = useCryptoAssetsViewModel();
  return <CryptoAssetsView viewModel={viewModel} />;
}
