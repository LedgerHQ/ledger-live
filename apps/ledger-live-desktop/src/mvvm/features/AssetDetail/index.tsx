import React from "react";
import { AssetDetailView } from "./AssetDetailView";
import { useAssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

const ASSET_NOT_FOUND_MESSAGE = "Asset distribution item not found.";

const AssetDetail = () => {
  const { distributionItem } = useAssetDetailViewModel();

  if (!distributionItem) {
    return (
      <section className="rounded-16 border border-dashed border-neutral-c70/30 p-16 text-body text-neutral-c70">
        {ASSET_NOT_FOUND_MESSAGE}
      </section>
    );
  }

  return <AssetDetailView distributionItem={distributionItem} />;
};

export default AssetDetail;
