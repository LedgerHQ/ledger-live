import React, { memo } from "react";
import { MarketBannerHeaderView } from "./MarketBannerHeaderView";

type MarketBannerHeaderProps = {
  readonly onNavigate: () => void;
};

export const MarketBannerHeader = memo(function MarketBannerHeader({
  onNavigate,
}: MarketBannerHeaderProps) {
  return <MarketBannerHeaderView onNavigate={onNavigate} />;
});
