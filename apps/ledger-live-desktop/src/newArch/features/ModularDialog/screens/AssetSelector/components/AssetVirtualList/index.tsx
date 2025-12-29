import React, { useCallback } from "react";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { VirtualList } from "LLD/components/VirtualList";
import { AssetListItem } from "../AssetListItem";

type AssetVirtualListProps = {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
  onVisibleItemsScrollEnd?: () => void;
  scrollToTop?: boolean;
  hasNextPage?: boolean;
  isDebuggingDuplicates?: boolean;
};

export const AssetVirtualList = ({
  assets,
  onClick,
  onVisibleItemsScrollEnd,
  scrollToTop,
  hasNextPage,
  isDebuggingDuplicates,
}: AssetVirtualListProps) => {
  const renderAssetItem = useCallback(
    (props: AssetType) => (
      <AssetListItem {...props} shouldDisplayId={isDebuggingDuplicates} onClick={onClick} />
    ),
    [onClick, isDebuggingDuplicates],
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
