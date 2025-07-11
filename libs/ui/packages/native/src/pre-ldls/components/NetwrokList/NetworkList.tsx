import React, { useCallback, useEffect, useRef } from "react";
import { FlashList } from "@shopify/flash-list";
import { Network, NetworkItem } from "../NetworkItem/NetworkItem";

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
  const flashListRef = useRef<FlashList<Network>>(null);

  const renderNetworkItem = useCallback(
    ({ item }: { item: Network }) => <NetworkItem {...item} onClick={() => onClick(item.id)} />,
    [onClick],
  );

  const keyExtractor = useCallback((item: Network, index: number) => `${item.id}-${index}`, []);

  useEffect(() => {
    if (scrollToTop && flashListRef.current) {
      flashListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [scrollToTop]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && onVisibleItemsScrollEnd) {
      onVisibleItemsScrollEnd();
    }
  }, [hasNextPage, onVisibleItemsScrollEnd]);

  const flashListProps = {
    ref: flashListRef,
    data: networks,
    renderItem: renderNetworkItem,
    keyExtractor,
    estimatedItemSize: 72,
    style: { flex: 1, width: "100%" as const },
    ...(hasNextPage && {
      onEndReached: handleEndReached,
      onEndReachedThreshold: 0.1,
    }),
  };

  return <FlashList {...flashListProps} />;
};
