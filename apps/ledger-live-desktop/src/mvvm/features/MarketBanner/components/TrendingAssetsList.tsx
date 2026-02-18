import React, { useCallback } from "react";
import { Tile, TileSpot, TileTitle, TileContent } from "@ledgerhq/lumen-ui-react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PerformanceIndicator } from "./PerformanceIndicator";
import { useNavigate } from "react-router";
import { ViewAllTile } from "./ViewAllTile";
import { AssetIcon } from "./AssetIcon";
import { track } from "~/renderer/analytics/segment";
import { TRACKING_PAGE_NAME } from "../utils/constants";
import FearAndGreed from "LLD/features/FearAndGreed";

type TrendingAssetsListProps = {
  readonly items: MarketItemPerformer[];
};

export const TrendingAssetsList = ({ items }: TrendingAssetsListProps) => {
  const navigate = useNavigate();

  const onAssetClick = useCallback(
    (id: string) => () => {
      track("button_clicked", {
        button: "Market Tile",
        currency: id,
        page: TRACKING_PAGE_NAME,
      });
      navigate(`/market/${id}`);
    },
    [navigate],
  );

  const getCapitalizedTicker = (item: MarketItemPerformer) => item.ticker.toUpperCase();

  return (
    <div
      className="scrollbar-none flex flex-col overflow-x-scroll py-2"
      data-testid="trending-assets-list"
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
  );
};
