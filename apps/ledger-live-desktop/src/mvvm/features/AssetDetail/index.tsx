import React from "react";
import { AssetDetailView } from "./AssetDetailView";
import { useAssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

const AssetDetail = () => <AssetDetailView {...useAssetDetailViewModel()} />;

export default AssetDetail;
