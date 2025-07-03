import React, { useCallback, useEffect, useRef } from "react";
import { FlatList } from "react-native";
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
  const flatListRef = useRef<FlatList<AssetType>>(null);

  const renderAssetItem = useCallback(
    ({ item }: { item: AssetType }) => <AssetItem {...item} onClick={onClick} />,
    [onClick],
  );

  const keyExtractor = useCallback((item: AssetType) => item.id, []);

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
    style: { flex: 1, width: "100%" },
    ...(hasNextPage && {
      onEndReached: handleEndReached,
      onEndReachedThreshold: 0.1,
    }),
  };

  return <FlatList {...flatListProps} />;
};
