import React from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { AssetDetailView } from "./AssetDetailView";
import { ScrubbedPriceProvider } from "./context/ScrubbedPriceContext";
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

  const currencyId = viewModel.distributionItem?.currency.id ?? viewModel.ledgerId;

  return (
    <>
      <TrackPage category={ASSET_DETAIL_TRACKING_PAGE_NAME} currency={currencyId} />
      <ScrubbedPriceProvider>
        <AssetDetailView viewModel={viewModel} />
      </ScrubbedPriceProvider>
    </>
  );
};

export default AssetDetail;
