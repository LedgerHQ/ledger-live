import React, { useCallback, useEffect, useRef } from "react";
import { FlashList } from "@shopify/flash-list";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";

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
  const flatListRef = useRef<FlashList<AssetType>>(null);

  const renderAssetItem = useCallback(
    ({ item }: { item: AssetType }) => <AssetItem {...item} onClick={onClick} />,
    [onClick],
  );

  const keyExtractor = useCallback((item: AssetType, index: number) => `${item.id}-${index}`, []);

  useEffect(() => {
    if (scrollToTop && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [scrollToTop]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && onVisibleItemsScrollEnd) {
      onVisibleItemsScrollEnd();
    }
  }, [hasNextPage, onVisibleItemsScrollEnd]);

  const flatListProps = {
    ref: flatListRef,
    data: assets,
    renderItem: renderAssetItem,
    keyExtractor,
    estimatedItemSize: 72,
    style: { flex: 1, width: "100%" as const },
    ...(hasNextPage && {
      onEndReached: handleEndReached,
      onEndReachedThreshold: 0.1,
    }),
  };

  return <FlashList {...flatListProps} />;
};
