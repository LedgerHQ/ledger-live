import { useMemo } from "react";
import { cssVar } from "@ledgerhq/lumen-design-core";
import {
  DEFAULT_MAX_OVERFLOW_DISPLAY,
  DEFAULT_MAX_VISIBLE_ICONS,
  sliceItemsForIconStackDisplay,
} from "../utils/sliceItemsForIconStackDisplay";
import type { IconStackLayoutOptions, IconStackViewModelParams, LayoutStyles } from "../types";

const DEFAULT_BORDER_COLOR = cssVar("var(--color-background-surface)");

function resolveLayoutStyles({
  size,
  overlap,
  borderWidth = 2,
  borderColor,
  borderRadius,
}: IconStackLayoutOptions): LayoutStyles {
  const resolvedOverlap = overlap ?? Math.round(size * 0.25);
  const resolvedBorderRadius = borderRadius ?? Math.round(size * 0.25) + borderWidth;
  const resolvedBorderColor = borderColor ?? DEFAULT_BORDER_COLOR;

  return {
    borderWidth,
    resolvedOverlap,
    resolvedBorderRadius,
    resolvedBorderColor,
    wrapperSize: size + borderWidth * 2,
  };
}

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
}: IconStackViewModelParams<T>) {
  const { visibleItems, displayedOverflowCount } = useMemo(
    () => sliceItemsForIconStackDisplay(items, maxVisible, maxOverflowDisplay),
    [items, maxVisible, maxOverflowDisplay],
  );

  return {
    layoutStyles: resolveLayoutStyles({ size, overlap, borderWidth, borderColor, borderRadius }),
    testID,
    className,
    visibleItems,
    displayedOverflowCount,
    hasOverflowBadge: items.length > visibleItems.length,
    tooltipContent: getTooltipContent(items),
    overflowTestID,
  };
}
