import React, { useCallback } from "react";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AssetList = ({
  assets,
  onClick,
  onVisibleItemsScrollEnd,
}: {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
  onVisibleItemsScrollEnd?: () => void;
}) => {
  const renderAssetItem = useCallback(
    ({ name, ticker, id }: AssetType) => (
      <AssetItem name={name} ticker={ticker} id={id} onClick={onClick} />
    ),
    [onClick],
  );

  return (
    <VirtualList
      itemHeight={64}
      items={assets}
      onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      renderItem={renderAssetItem}
    />
  );
};
