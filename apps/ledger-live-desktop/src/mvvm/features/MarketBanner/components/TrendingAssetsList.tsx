import React, { useCallback } from "react";
import { Tile, TileSpot, TileTitle, TileContent } from "@ledgerhq/lumen-ui-react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PerformanceIndicator } from "./PerformanceIndicator";
import { useNavigate } from "react-router";
import { ViewAllTile } from "./ViewAllTile";
import FearAndGreed from "./FearAndGreed";
import { AssetIcon } from "./AssetIcon";

type TrendingAssetsListProps = {
  readonly items: MarketItemPerformer[];
};

export const TrendingAssetsList = ({ items }: TrendingAssetsListProps) => {
  const navigate = useNavigate();

  const onAssetClick = useCallback(
    (id: string) => () => {
      navigate(`/market/${id}`);
    },
    [navigate],
  );

  const getCapitalizedTicker = (item: MarketItemPerformer) => item.ticker.toUpperCase();

  return (
    <div className="flex flex-col overflow-x-scroll" data-testid="trending-assets-list">
      <div className="flex items-center gap-8">
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
              appearance="icon"
              icon={() => <AssetIcon item={item} getCapitalizedTicker={getCapitalizedTicker} />}
            />
            <TileContent>
              <TileTitle>{getCapitalizedTicker(item)}</TileTitle>
            </TileContent>
            <PerformanceIndicator value={item} />
          </Tile>
        ))}
        <ViewAllTile />
      </div>
    </div>
  );
};
