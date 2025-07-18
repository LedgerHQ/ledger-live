import React, { useCallback, useEffect, useRef } from "react";
import { Network, NetworkItem } from "../NetworkItem/NetworkItem";
import { FlatList, FlatListProps } from "react-native";

const ITEM_PADDING = 8;
const ITEM_HEIGHT = 48 + ITEM_PADDING * 2;

export const NetworkList = ({
  networks,
  onClick,
  onVisibleItemsScrollEnd,
  scrollToTop,
  hasNextPage,
}: {
  networks: Network[];
  onClick: (networkId: string) => void;
  onVisibleItemsScrollEnd?: () => void;
  scrollToTop?: boolean;
  hasNextPage?: boolean;
}) => {
  const flatListRef = useRef<FlatList<Network>>(null);

  const renderNetworkItem = useCallback(
    ({ item }: { item: Network }) => <NetworkItem {...item} onClick={() => onClick(item.id)} />,
    [onClick],
  );

  const keyExtractor = useCallback((item: Network, index: number) => `${item.id}-${index}`, []);

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

  const flatListProps: FlatListProps<Network> = {
    data: networks,
    renderItem: renderNetworkItem,
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
