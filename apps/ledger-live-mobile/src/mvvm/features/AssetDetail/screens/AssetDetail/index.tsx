import React from "react";
import { useAssetDetailViewModel } from "./useAssetDetailViewModel";
import { AssetDetailView } from "./AssetDetailView";

export default function AssetDetail() {
  const viewModel = useAssetDetailViewModel();
  return <AssetDetailView {...viewModel} />;
}
