import React from "react";
import useMarketBannerViewModel from "./hooks/useMarketBannerViewModel";
import MarketBannerView from "./components/MarketBannerView";
import { MarketBannerProps } from "./types";

const MarketBanner = ({ testID }: MarketBannerProps) => {
  const {
    items,
    isLoading,
    isError,
    isEnabled,
    range,
    onTilePress,
    onViewAllPress,
    onSectionTitlePress,
    onSwipe,
  } = useMarketBannerViewModel();

  if (!isEnabled || isError) {
    return null;
  }

  return (
    <MarketBannerView
      items={items}
      isLoading={isLoading}
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
export { MarketBanner };
