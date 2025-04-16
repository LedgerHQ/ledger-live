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
    <VirtualList itemHeight={64} maxHeight={250}>
      {assets.map(({ name, ticker }) => (
        <AssetItem name={name} ticker={ticker} onClick={onClick} />
      ))}
    </VirtualList>
  );
};
