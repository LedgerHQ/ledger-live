import { ItemStatus } from "./types";

/**
 * Returns the status of an indexed item from the carousel index.
 */
export const getItemStatus = (itemIndex: number, activeIndex: number) => {
  const itemDistanceFromActiveIndex = Math.abs(itemIndex - activeIndex);

  switch (itemDistanceFromActiveIndex) {
    case 0:
      return ItemStatus.active;
    case 1:
      return ItemStatus.nearby;
    case 2:
      return ItemStatus.far;
    default:
      return ItemStatus.none;
  }
};
