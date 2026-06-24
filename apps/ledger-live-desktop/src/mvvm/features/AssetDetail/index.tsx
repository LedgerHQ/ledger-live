import React from "react";
import { Navigate } from "react-router";
import TrackPage from "~/renderer/analytics/TrackPage";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { AssetDetailView } from "./AssetDetailView";
import { ScrubbedPriceProvider } from "./context/ScrubbedPriceContext";
import { useAssetDetailViewModel } from "./hooks/useAssetDetailViewModel";

const AssetDetail = () => {
  const viewModel = useAssetDetailViewModel();

  // An unresolved asset (e.g. an invalid deeplink id) redirects to the Market list instead of
  // showing an empty/not-found screen. `replace` keeps it out of history so Back doesn't return.
  if (viewModel.mode === "not-found") {
    return <Navigate to="/market" replace />;
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
