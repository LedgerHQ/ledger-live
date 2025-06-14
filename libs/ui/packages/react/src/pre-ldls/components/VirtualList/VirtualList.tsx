import React, { useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Flex, InfiniteLoader } from "../../../components";

interface VirtualItem {
  key: string | number | bigint;
  index: number;
  start: number;
  end: number;
  size: number;
}

/**
 * Props for the VirtualList component, which efficiently renders large lists
 * by virtualizing DOM nodes to improve performance.
 */
type VirtualListProps<T> = {
  /**
   * Height of each item in the list.
   * This is used to calculate the total height of the list and the position of each item.
   */
  itemHeight: number;
  /**
   * Number of extra items to render outside the visible viewport for smoother scrolling.
   * Defaults to 5.
   */
  overscan?: number;
  /**
   * React component or node to display when the list is loading additional items.
   * If not provided, a default loading spinner will be used.
   */
  LoadingComponent?: React.ReactNode;
  /**
   * Indicates whether new items are currently being loaded.
   */
  isLoading?: boolean;
  /**
   * Indicates if there are more items to load.
   */
  hasNextPage?: boolean;
  /**
   * Number of items to check before the end of the list to trigger loading more items.
   * Defaults to 5.
   */
  threshold?: number;
  /**
   * Callback function to be called when the user scrolls to the end of the visible items.
   * This can be used to load more items when the user reaches the end of the list.
   */
  onVisibleItemsScrollEnd?: () => void;
  /**
   * Function to render each item in the list.
   * Receives a single value from the items array as an argument and should return a React node.
   */
  renderItem: (item: T) => React.ReactNode;
  /**
   * The array of items which will be rendered
   */
  items: T[];
  /**
   * When set to true, the list will scroll to the top
   */
  scrollToTop?: boolean;
  /**
   * React component or node to display at the bottom of the list, after all items.
   */
  bottomComponent?: React.ReactNode;
};

const DefaultLoadingComponent = () => (
  <Flex justifyContent="center" alignItems="center" height="76px">
    <InfiniteLoader />
  </Flex>
);

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const VirtualList = <T,>({
  itemHeight,
  overscan = 5,
  LoadingComponent,
  isLoading,
  hasNextPage = false,
  threshold = 5,
  items,
  onVisibleItemsScrollEnd,
  renderItem,
  scrollToTop = false,
  bottomComponent,
}: VirtualListProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const scrollToFn = useCallback(
    (
      offset: number,
      options: { adjustments?: number; behavior?: "auto" | "smooth" },
      instance: { scrollElement: HTMLElement | null },
    ) => {
      const element = instance.scrollElement;
      if (!element) return;

      const duration = options.behavior === "smooth" ? 100 : 0;

      if (duration === 0) {
        element.scrollTop = offset;
        return;
      }

      const startTime = performance.now();
      const startTop = element.scrollTop;
      const distanceToScroll = offset - startTop;

      const scrollStep = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easedProgress = easeInOutCubic(progress);

        element.scrollTop = startTop + distanceToScroll * easedProgress;

        if (progress < 1) {
          requestAnimationFrame(scrollStep);
        }
      };

      requestAnimationFrame(scrollStep);
    },
    [],
  );

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    overscan,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    scrollToFn,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (scrollToTop && parentRef.current) {
      scrollToFn(0, { behavior: "smooth" }, { scrollElement: parentRef.current });
    }
  }, [scrollToTop, scrollToFn]);

  useEffect(() => {
    if (!virtualItems.length) return;
    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem.index >= virtualItems.length - 1 - threshold &&
      hasNextPage &&
      !isLoading &&
      onVisibleItemsScrollEnd
    ) {
      onVisibleItemsScrollEnd();
    }
  }, [hasNextPage, onVisibleItemsScrollEnd, isLoading, threshold, virtualItems]);

  const showCustomLoadingComponent = !!LoadingComponent;

  return (
    <div
      ref={parentRef}
      style={{ width: "100%", height: "100%", overflow: "auto", scrollbarWidth: "none" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => (
          <div
            key={virtualRow.index}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translateY(${virtualRow.start}px)`,
              height: `${itemHeight}px`,
              width: "100%",
            }}
          >
            {renderItem(items[virtualRow.index])}
          </div>
        ))}
        {bottomComponent && (
          <div
            style={{
              position: "absolute",
              top: `${rowVirtualizer.getTotalSize()}px`,
              left: 0,
              width: "100%",
            }}
          >
            {bottomComponent}
          </div>
        )}
      </div>
      {isLoading && (showCustomLoadingComponent ? LoadingComponent : <DefaultLoadingComponent />)}
    </div>
  );
};
