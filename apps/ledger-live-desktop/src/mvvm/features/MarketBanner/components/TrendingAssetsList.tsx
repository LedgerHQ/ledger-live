import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { ViewAllTile } from "./ViewAllTile";
import { TrendingAssetTile } from "./TrendingAssetTile";
import SkeletonList from "./SkeletonList";
import GenericError from "./GenericError";
import { track } from "~/renderer/analytics/segment";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import FearAndGreed from "LLD/features/FearAndGreed";
import { HorizontalScroll } from "LLD/components/HorizontalScroll";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { getMarketOrAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { MARKET_BANNER_TRACKING_SOURCE } from "../utils/constants";

type TrendingAssetsListProps = {
  readonly items: MarketItemPerformer[];
  readonly isLoading: boolean;
  readonly isError: boolean;
};

export const TrendingAssetsList = ({ items, isLoading, isError }: TrendingAssetsListProps) => {
  const navigate = useNavigate();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");

  const onAssetClick = useCallback(
    (id: string) => () => {
      track("button_clicked", {
        button: "Market Tile",
        currency: id,
        page: PORTFOLIO_TRACKING_PAGE_NAME,
      });
      setTrackingSource(MARKET_BANNER_TRACKING_SOURCE);
      navigate(getMarketOrAssetDetailPath(id, shouldDisplayAggregatedAssets));
    },
    [navigate, shouldDisplayAggregatedAssets],
  );

  let assets: React.ReactNode = null;
  if (isLoading) {
    assets = <SkeletonList />;
  } else if (isError) {
    assets = <GenericError />;
  } else if (items.length > 0) {
    assets = (
      <div data-testid="trending-assets-list" className="contents">
        {items.map(item => (
          <TrendingAssetTile key={item.id} item={item} onNavigate={onAssetClick} />
        ))}
        <ViewAllTile />
      </div>
    );
  }

  return (
    <HorizontalScroll
      data-testid="market-banner-carousel"
      scrollContainerTestId="scroll-container"
      scrollContainerClassName="flex flex-col py-2"
    >
      <div className="flex w-max items-stretch gap-8">
        <FearAndGreed />
        {assets}
      </div>
    </HorizontalScroll>
  );
};
