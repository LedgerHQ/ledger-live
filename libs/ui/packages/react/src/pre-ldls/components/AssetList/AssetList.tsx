import React, { useCallback } from "react";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AssetList = ({
  assets,
  onClick,
  onVisibleItemsScrollEnd,
  scrollToTop,
}: {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
  onVisibleItemsScrollEnd?: () => void;
  scrollToTop?: boolean;
}) => {
  const renderAssetItem = useCallback(
    ({ name, ticker, id }: AssetType) => (
      <AssetItem name={name} ticker={ticker} id={id} onClick={onClick} />
    ),
    [onClick],
  );

  return (
    <VirtualList
      itemHeight={70}
      items={assets}
      onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      renderItem={renderAssetItem}
      scrollToTop={scrollToTop}
    />
  );
};
