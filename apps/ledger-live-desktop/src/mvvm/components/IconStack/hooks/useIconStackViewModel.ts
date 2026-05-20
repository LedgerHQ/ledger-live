import { useMemo } from "react";
import {
  DEFAULT_MAX_OVERFLOW_DISPLAY,
  DEFAULT_MAX_VISIBLE_ICONS,
  sliceItemsForIconStackDisplay,
} from "../utils/sliceItemsForIconStackDisplay";
import type { IconStackItemsViewModelParams, IconStackLayoutProps } from "../types";

export function useIconStackViewModel<T>({
  items,
  maxVisible = DEFAULT_MAX_VISIBLE_ICONS,
  maxOverflowDisplay = DEFAULT_MAX_OVERFLOW_DISPLAY,
  getTooltipContent,
  size,
  overlap,
  borderWidth,
  borderColor,
  borderRadius,
  testID,
  className,
  overflowTestID,
}: IconStackItemsViewModelParams<T>) {
  const { visibleItems, displayedOverflowCount } = useMemo(
    () => sliceItemsForIconStackDisplay(items, maxVisible, maxOverflowDisplay),
    [items, maxVisible, maxOverflowDisplay],
  );

  const hasOverflowBadge = items.length > visibleItems.length;
  const tooltipContent = getTooltipContent(items);

  const layoutProps: IconStackLayoutProps = {
    size,
    overlap,
    borderWidth,
    borderColor,
    borderRadius,
    testID,
    className,
  };

  return {
    layoutProps,
    visibleItems,
    displayedOverflowCount,
    hasOverflowBadge,
    tooltipContent,
    overflowTestID,
  };
}
