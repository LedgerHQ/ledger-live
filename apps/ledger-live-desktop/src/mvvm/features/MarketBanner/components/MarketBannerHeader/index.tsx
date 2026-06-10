import React, { memo } from "react";
import { MarketBannerHeaderView } from "./MarketBannerHeaderView";
import { useMarketBannerHeaderViewModel } from "./useMarketBannerHeaderViewModel";

type MarketBannerHeaderProps = {
  readonly onNavigate: () => void;
};

export const MarketBannerHeader = memo(function MarketBannerHeader({
  onNavigate,
}: MarketBannerHeaderProps) {
  const { shouldDisplayAssetDiscoverability } = useMarketBannerHeaderViewModel();

  return (
    <MarketBannerHeaderView
      onNavigate={onNavigate}
      shouldDisplayAssetDiscoverability={shouldDisplayAssetDiscoverability}
    />
  );
});
