import React from "react";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AssetList = ({
  assets,
  onClick,
}: {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
}) => {
  return (
    <VirtualList
      itemHeight={64}
      count={assets.length}
      renderRow={(i: number) => (
        <AssetItem name={assets[i].name} ticker={assets[i].ticker} onClick={onClick} />
      )}
    />
  );
};
