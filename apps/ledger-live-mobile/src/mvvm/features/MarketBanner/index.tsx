import React from "react";
import useMarketBannerViewModel from "./hooks/useMarketBannerViewModel";
import MarketBannerView from "./components/MarketBannerView";
import { MarketBannerProps } from "./types";

const MarketBanner = ({ testID }: MarketBannerProps) => {
  const {
    items,
    isError,
    isEnabled,
    range,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
    onSwipe,
  } = useMarketBannerViewModel();

  if (!isEnabled) {
    return null;
  }

  return (
    <MarketBannerView
      isError={isError}
      items={items}
      range={range}
      onTilePress={onTilePress}
      onViewAllPress={onViewAllPress}
      onSectionTitlePress={onSectionTitlePress}
      onSwipe={onSwipe}
      testID={testID}
    />
  );
};

export default React.memo(MarketBanner);
