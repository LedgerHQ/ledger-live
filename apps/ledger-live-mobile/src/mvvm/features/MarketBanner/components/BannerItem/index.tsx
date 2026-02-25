import React from "react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import MarketTile from "../MarketTile";

export type ListItem = MarketItemPerformer;

interface BannerItemProps {
  item: ListItem;
  index: number;
  range: PortfolioRange;
  onTilePress: (item: MarketItemPerformer) => void;
}

const BannerItem = ({ item, index, range, onTilePress }: BannerItemProps) => {
  return <MarketTile item={item} index={index} range={range} onPress={onTilePress} />;
};

export default React.memo(BannerItem);
