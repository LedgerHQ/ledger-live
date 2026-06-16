import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { listItemHeight } from "~/renderer/screens/market/components/Table";

type UseMarketListVirtualizationParams = {
  itemCount: number;
  marketData: MarketCurrencyData[];
  loading: boolean;
  currenciesLength: number;
  listKey: string;
  onLoadNextPage: () => void;
  checkIfDataIsStaleAndRefetch: (scrollOffset: number) => void;
};

export const useMarketListVirtualization = ({
  itemCount,
  marketData,
  loading,
  currenciesLength,
  listKey,
  onLoadNextPage,
  checkIfDataIsStaleAndRefetch,
}: UseMarketListVirtualizationParams) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const lastFetchedIndexRef = useRef<number>(-1);

  // When the list identity changes (category/search/sort…) jump back to the top and re-arm the
  // pagination guard below — which is absolute and would otherwise stay stuck at the previous
  // list's scroll depth, both blocking loading more and leaving the new list scrolled off-screen.
  useEffect(() => {
    lastFetchedIndexRef.current = -1;
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [listKey]);

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

    if (currenciesLength === 0) return;

    // Re-fetch only when the bottom is reached AND new rows have arrived since the last fetch.
    // This is the actual end-detector: when a page adds nothing, the list stops growing and so
    // does pagination. It works for every list (all, categories, stocks) regardless of itemCount.
    const shouldFetch =
      lastVirtualItemIndex >= marketData.length - 1 &&
      lastFetchedIndexRef.current < marketData.length;

    if (shouldFetch) {
      lastFetchedIndexRef.current = marketData.length;
      onLoadNextPage();
    }
  }, [marketData.length, currenciesLength, onLoadNextPage, loading, lastVirtualItemIndex]);

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
    virtualItems,
    totalSize: rowVirtualizer.getTotalSize(),
  };
};
