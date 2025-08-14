import React, { useCallback } from "react";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AssetList = ({
  assets,
  onClick,
  onVisibleItemsScrollEnd,
  scrollToTop,
  hasNextPage,
}: {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
  onVisibleItemsScrollEnd?: () => void;
  scrollToTop?: boolean;
  hasNextPage?: boolean;
}) => {
  const renderAssetItem = useCallback(
    (props: AssetType) => <AssetItem {...props} onClick={onClick} />,
    [onClick],
  );

  return (
    <VirtualList
      itemHeight={64}
      items={assets}
      onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      renderItem={renderAssetItem}
      scrollToTop={scrollToTop}
      hasNextPage={hasNextPage}
    />
  );
};
