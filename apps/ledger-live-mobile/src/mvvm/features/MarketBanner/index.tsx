import React from "react";
import useMarketBannerViewModel from "./hooks/useMarketBannerViewModel";
import MarketBannerView from "./components/MarketBannerView";
import { MarketBannerProps } from "./types";

const MarketBanner = ({ testID }: MarketBannerProps) => {
  const {
    items,
    isError,
    isEnabled,
    showFilter,
    bannerFilter,
    range,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
  } = useMarketBannerViewModel();

  if (!isEnabled) {
    return null;
  }

  return (
    <MarketBannerView
      isError={isError}
      items={items}
      range={range}
      showFilter={showFilter}
      bannerFilter={bannerFilter}
      onTilePress={onTilePress}
      onViewAllPress={onViewAllPress}
      onSectionTitlePress={onSectionTitlePress}
      testID={testID}
    />
  );
};

export default React.memo(MarketBanner);
