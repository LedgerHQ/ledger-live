import React, { useCallback } from "react";
import { Tile, Spot, TileTitle, TileContent } from "@ledgerhq/lumen-ui-react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PerformanceIndicator } from "./PerformanceIndicator";
import { AssetIcon } from "./AssetIcon";

type TrendingAssetTileProps = {
  readonly item: MarketItemPerformer;
  readonly onNavigate: (id: string) => () => void;
};

const TrendingAssetTileComponent = ({ item, onNavigate }: TrendingAssetTileProps) => {
  const capitalizedTicker = item.ticker.toUpperCase();
  const ledgerId = item.ledgerIds?.[0];
  const ticker = item.ticker;
  const image = item.image;

  const renderIcon = useCallback(
    () => (
      <AssetIcon
        ledgerId={ledgerId}
        ticker={ticker}
        image={image}
        capitalizedTicker={capitalizedTicker}
      />
    ),
    [ledgerId, ticker, image, capitalizedTicker],
  );

  return (
    <Tile
      className="w-[98px]"
      appearance="card"
      onClick={onNavigate(item.id)}
      data-testid={`market-banner-asset-${item.id}`}
    >
      <Spot size={40} appearance="icon" icon={renderIcon} />
      <TileContent>
        <TileTitle>{capitalizedTicker}</TileTitle>
        <PerformanceIndicator value={item} />
      </TileContent>
    </Tile>
  );
};

export const TrendingAssetTile = React.memo(TrendingAssetTileComponent);
