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

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => listItemHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem || loading) return;

    if (lastItem.index >= marketData.length - 1 && currenciesLength > 0) {
      onLoadNextPage();
    }
  }, [marketData.length, currenciesLength, onLoadNextPage, loading, virtualItems]);

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
