import React from "react";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import MarketTile from "../MarketTile";
import ViewAllTile from "../ViewAllTile";
import SkeletonTile from "../SkeletonTile";

export type ListItem = MarketItemPerformer | { type: "viewAll" } | { type: "skeleton"; id: number };

interface BannerItemProps {
  item: ListItem;
  index: number;
  range: PortfolioRange;
  onTilePress: (item: MarketItemPerformer) => void;
  onViewAllPress: () => void;
}

const BannerItem = ({ item, index, range, onTilePress, onViewAllPress }: BannerItemProps) => {
  if ("type" in item && item.type === "viewAll") {
    return <ViewAllTile onPress={onViewAllPress} />;
  }
  if ("type" in item && item.type === "skeleton") {
    return <SkeletonTile index={index} />;
  }
  return <MarketTile item={item} index={index} range={range} onPress={onTilePress} />;
};

export default React.memo(BannerItem);
