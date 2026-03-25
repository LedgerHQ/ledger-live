import React from "react";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { CryptoAssetsViewModel } from "./types";

export function CryptoAssetsView({ viewModel }: { readonly viewModel: CryptoAssetsViewModel }) {
  const { title, onBack } = viewModel;

  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="Crypto assets" />
      <PageHeader title={title} onBack={onBack} />
    </div>
  );
}
