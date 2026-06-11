import React, { memo } from "react";
import { MarketBannerRankingSelectView } from "./MarketBannerRankingSelectView";
import { useMarketBannerRankingSelectViewModel } from "./useMarketBannerRankingSelectViewModel";

export const MarketBannerRankingSelect = memo(function MarketBannerRankingSelect() {
  const { options, selectedValue, selectedLabel, onValueChange } =
    useMarketBannerRankingSelectViewModel();

  return (
    <MarketBannerRankingSelectView
      options={options}
      selectedValue={selectedValue}
      selectedLabel={selectedLabel}
      onValueChange={onValueChange}
    />
  );
});
