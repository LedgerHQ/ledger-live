import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { listItemHeight } from "../components/Table";

type UseMarketListVirtualizationParams = {
  itemCount: number;
  marketData: MarketCurrencyData[];
  loading: boolean;
  currenciesLength: number;
  onLoadNextPage: () => void;
  checkIfDataIsStaleAndRefetch: (scrollOffset: number) => void;
};

export const useMarketListVirtualization = ({
  itemCount,
  marketData,
  loading,
  currenciesLength,
  onLoadNextPage,
  checkIfDataIsStaleAndRefetch,
}: UseMarketListVirtualizationParams) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const lastFetchedIndexRef = useRef<number>(-1);

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => listItemHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastVirtualItemIndex =
    virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1;

  useEffect(() => {
    if (lastVirtualItemIndex === -1 || loading) return;

    const hasMoreData = itemCount > marketData.length;
    if (!hasMoreData || currenciesLength === 0) return;

    const shouldFetch =
      lastVirtualItemIndex >= marketData.length - 1 &&
      lastFetchedIndexRef.current < marketData.length;

    if (shouldFetch) {
      lastFetchedIndexRef.current = marketData.length;
      onLoadNextPage();
    }
  }, [
    itemCount,
    marketData.length,
    currenciesLength,
    onLoadNextPage,
    loading,
    lastVirtualItemIndex,
  ]);

  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      checkIfDataIsStaleAndRefetch(scrollElement.scrollTop);
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [checkIfDataIsStaleAndRefetch]);

  return {
    parentRef,
    rowVirtualizer,
  };
};
