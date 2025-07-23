import React, { useCallback, useEffect, useRef } from "react";
import { FlatList, FlatListProps } from "react-native";
import { AssetItem, AssetType } from "../AssetItem/AssetItem";

const ITEM_PADDING = 8;
const ITEM_HEIGHT = 48 + ITEM_PADDING * 2;

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
  const flatListRef = useRef<FlatList<AssetType>>(null);

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

  const flatListProps: FlatListProps<AssetType> = {
    data: assets,
    renderItem: renderAssetItem,
    initialNumToRender: 15,
    keyExtractor,
    getItemLayout: (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    ...(hasNextPage && {
      onEndReached: handleEndReached,
      onEndReachedThreshold: 0.1,
    }),
  };

  return <FlatList ref={flatListRef} {...flatListProps} />;
};
