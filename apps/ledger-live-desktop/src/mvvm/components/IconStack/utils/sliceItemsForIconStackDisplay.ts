export const DEFAULT_MAX_VISIBLE_ICONS = 4;
export const DEFAULT_MAX_OVERFLOW_DISPLAY = 99;

export type IconStackDisplaySlice<T> = {
  readonly visibleItems: readonly T[];
  readonly displayedOverflowCount: number;
};

export function sliceItemsForIconStackDisplay<T>(
  items: readonly T[],
  maxVisible = DEFAULT_MAX_VISIBLE_ICONS,
  maxOverflowDisplay = DEFAULT_MAX_OVERFLOW_DISPLAY,
): IconStackDisplaySlice<T> {
  const hasOverflow = items.length > maxVisible;
  const visibleItems = items.slice(0, hasOverflow ? maxVisible - 1 : items.length);
  const extraCount = items.length - visibleItems.length;

  return {
    visibleItems,
    displayedOverflowCount: Math.min(extraCount, maxOverflowDisplay),
  };
}
