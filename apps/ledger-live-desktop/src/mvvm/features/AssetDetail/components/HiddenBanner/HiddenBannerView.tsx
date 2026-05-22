import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { HiddenBannerViewModel } from "./useHiddenBannerViewModel";

export type HiddenBannerViewProps = Readonly<{
  viewModel: HiddenBannerViewModel;
}>;

export function HiddenBannerView({ viewModel }: HiddenBannerViewProps) {
  const { isHidden, description, primaryActionLabel, onShowAsset } = viewModel;

  if (!isHidden) return null;

  return (
    <Banner
      appearance="info"
      description={description}
      data-testid="asset-detail-hidden-banner"
      primaryAction={
        <Button
          appearance="transparent"
          size="sm"
          onClick={onShowAsset}
          data-testid="asset-detail-hidden-banner-show-asset"
        >
          {primaryActionLabel}
        </Button>
      }
    />
  );
}
