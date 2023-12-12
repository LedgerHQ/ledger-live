import { ItemStatus } from "./types";

/**
 * Returns the status of an indexed item from the carousel index.
 */
export const getItemStatus = (itemIndex: number, carouselIndex: number) => {
  return itemIndex === carouselIndex
    ? ItemStatus.active
    : Math.abs(itemIndex - carouselIndex) === 1
    ? ItemStatus.nearby
    : Math.abs(itemIndex - carouselIndex) === 2
    ? ItemStatus.far
    : ItemStatus.none;
};
