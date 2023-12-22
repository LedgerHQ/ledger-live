import { ItemStatus } from "./types";

/**
 * Returns the status of an indexed item from the carousel index.
 */
export const getItemStatus = (itemIndex: number, activeIndex: number) => {
  const itemDistanceFromActiveIndex = Math.abs(itemIndex - activeIndex);

  if (itemDistanceFromActiveIndex === 0) {
    return ItemStatus.active;
  } else if (itemDistanceFromActiveIndex === 1) {
    return ItemStatus.nearby;
  } else if (itemDistanceFromActiveIndex === 2) {
    return ItemStatus.far;
  }
  return ItemStatus.none;
};
