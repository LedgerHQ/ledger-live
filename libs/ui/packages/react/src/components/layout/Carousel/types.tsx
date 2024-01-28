import { ReactElement } from "react";
import { UseEmblaCarouselType } from "embla-carousel-react";

/**
 * Carousel's variants.
 */
export type Variant = "content-card" | "default";

/**
 * Carousel's props.
 */
export type Props = {
  children: ReactElement[];
  variant?: Variant;
};

/**
 * Carousel's sub props to be passed to any component used by the carousel..
 */
export type SubProps = Required<Props> & {
  emblaApi: UseEmblaCarouselType[1];
  currentIndex: number;
};
