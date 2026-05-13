import React from "react";
import { useTranslation } from "react-i18next";
import { AssetDetailView } from "./AssetDetailView";
import { useAssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

const AssetDetail = () => {
  const { t } = useTranslation();
  const viewModel = useAssetDetailViewModel();

  if (viewModel.mode === "loading") {
    return (
      <div className="flex w-full shrink-0 flex-col gap-32 pb-32">
        <div className="h-40 w-1/3 animate-pulse rounded-8 bg-neutral-c20" />
        <div className="grid grid-cols-2 gap-24">
          <div className="h-[200px] animate-pulse rounded-16 bg-neutral-c20" />
          <div className="h-[200px] animate-pulse rounded-16 bg-neutral-c20" />
        </div>
      </div>
    );
  }

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
