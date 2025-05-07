import React, { useCallback } from "react";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AssetList = ({
  assets,
  onClick,
}: {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
}) => {
  const renderAssetItem = useCallback(
    ({ name, ticker }: AssetType) => <AssetItem name={name} ticker={ticker} onClick={onClick} />,
    [onClick],
  );

  return <VirtualList itemHeight={64} items={assets} renderItem={renderAssetItem} />;
};
