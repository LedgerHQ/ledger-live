import React, { useCallback } from "react";
import { Tile, TileSpot, TileTitle, TileContent } from "@ledgerhq/lumen-ui-react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PerformanceIndicator } from "./PerformanceIndicator";
import { useNavigate } from "react-router";
import { ViewAllTile } from "./ViewAllTile";
import { AssetIcon } from "./AssetIcon";
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
  const { scrollContainerRef, isAtStart, isAtEnd, scrollLeft, scrollRight } = useHorizontalScroll();

  const onAssetClick = useCallback(
    (id: string) => () => {
      track("button_clicked", {
        button: "Market Tile",
        currency: id,
        page: PORTFOLIO_TRACKING_PAGE_NAME,
      });
      navigate(`/market/${id}`);
    },
    [navigate],
  );

  const getCapitalizedTicker = (item: MarketItemPerformer) => item.ticker.toUpperCase();

  return (
    <div className="group relative" data-testid="trending-assets-list">
      {!isAtStart && <ScrollArrowButton direction="left" onClick={scrollLeft} />}
      <div
        ref={scrollContainerRef}
        data-testid="scroll-container"
        className="scrollbar-none flex flex-col overflow-x-scroll py-2"
      >
        <div className="flex items-stretch gap-8">
          <FearAndGreed />
          {items.map(item => (
            <Tile
              className="w-[98px]"
              key={item.id}
              appearance="card"
              onClick={onAssetClick(item.id)}
              data-testid={`market-banner-asset-${item.id}`}
            >
              <TileSpot
                size={40}
                appearance="icon"
                icon={() => <AssetIcon item={item} getCapitalizedTicker={getCapitalizedTicker} />}
              />
              <TileContent>
                <TileTitle>{getCapitalizedTicker(item)}</TileTitle>
                <PerformanceIndicator value={item} />
              </TileContent>
            </Tile>
          ))}
          <ViewAllTile />
        </div>
      </div>
      {!isAtEnd && <ScrollArrowButton direction="right" onClick={scrollRight} />}
    </div>
  );
};
