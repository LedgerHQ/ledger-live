import { CarouselItem } from "~/contentCards/layouts/carousel/types";

/**
 * Util function to create a carousel item with proper typings.
 */
export const carouselItem = <P,>(component: React.FC<P>, props: CarouselItem<P>["props"]) => {
  return {
    component,
    props,
  } as CarouselItem<P>;
};
