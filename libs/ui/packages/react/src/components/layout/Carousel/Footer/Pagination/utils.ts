import { ItemStatus } from "./types";

/**
 * Returns the status of an indexed item from the carousel index.
 */
export const getItemStatus = (itemIndex: number, activeIndex: number, itemCount: number) => {
  const isActive = itemIndex === activeIndex;
  if (isActive) {
    return ItemStatus.active;
  }

  const isAdjacent = Math.abs(itemIndex - activeIndex) === 1;
  if (isAdjacent) {
    return ItemStatus.nearby;
  }

  const isEdge = itemIndex === 0 || itemIndex === itemCount - 1;
  return isEdge ? ItemStatus.far : ItemStatus.nearby;
};
