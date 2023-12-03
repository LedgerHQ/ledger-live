import { CarouselItemMetadata } from "../types";

export interface CarouselItem<Props = any> {
  component: React.FC<Props>;
  props: CarouselItemMetadata & Props;
}

export const carouselItem = <Props,>(
  component: React.FC<Props>,
  props: CarouselItem<Props>["props"],
) => {
  return {
    component,
    props,
  } as CarouselItem<Props>;
};
