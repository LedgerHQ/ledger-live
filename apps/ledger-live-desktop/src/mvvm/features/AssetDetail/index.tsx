import React from "react";
import { useTranslation } from "react-i18next";
import { AssetDetailView } from "./AssetDetailView";
import { useAssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

const AssetDetail = () => {
  const { t } = useTranslation();
  const viewModel = useAssetDetailViewModel();

  if (viewModel.mode === "not-found") {
    return (
      <section className="rounded-16 border border-dashed border-neutral-c70/30 p-16 text-body text-neutral-c70">
        {t("assetDetails.notFound")}
      </section>
    );
  }

  return <AssetDetailView viewModel={viewModel} />;
};

export default AssetDetail;
