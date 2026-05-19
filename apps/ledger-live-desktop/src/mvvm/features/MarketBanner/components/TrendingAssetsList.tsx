import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import { ViewAllTile } from "./ViewAllTile";
import { TrendingAssetTile } from "./TrendingAssetTile";
import { track } from "~/renderer/analytics/segment";
import FearAndGreed from "LLD/features/FearAndGreed";
import { useHorizontalScroll } from "../hooks/useHorizontalScroll";
import { ScrollArrowButton } from "./ScrollArrowButton";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";

type TrendingAssetsListProps = {
  readonly items: MarketItemPerformer[];
};

export const TrendingAssetsList = ({ items }: TrendingAssetsListProps) => {
  const navigate = useNavigate();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const { scrollContainerRef, isAtStart, isAtEnd, scrollLeft, scrollRight } = useHorizontalScroll();

  const onAssetClick = useCallback(
    (id: string) => () => {
      track("button_clicked", {
        button: "Market Tile",
        currency: id,
        page: PORTFOLIO_TRACKING_PAGE_NAME,
      });
      navigate(shouldDisplayAggregatedAssets ? `/asset/${id}` : `/market/${id}`);
    },
    [navigate, shouldDisplayAggregatedAssets],
  );

  return (
    <div className="group relative" data-testid="trending-assets-list">
      {!isAtStart && <ScrollArrowButton direction="left" onClick={scrollLeft} />}
      <div
        ref={scrollContainerRef}
        data-testid="scroll-container"
        className="scrollbar-none flex flex-col overflow-x-scroll py-2"
      >
        <div className="flex w-max items-stretch gap-8">
          <FearAndGreed />
          {items.map(item => (
            <TrendingAssetTile key={item.id} item={item} onNavigate={onAssetClick} />
          ))}
          <ViewAllTile />
        </div>
      </div>
      {!isAtEnd && <ScrollArrowButton direction="right" onClick={scrollRight} />}
    </div>
  );
};
