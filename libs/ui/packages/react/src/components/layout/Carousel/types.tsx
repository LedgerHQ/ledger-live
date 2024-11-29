import { ReactElement } from "react";
import { UseEmblaCarouselType } from "embla-carousel-react";

export type Variant = "content-card" | "default";

export type Props = {
  children: ReactElement[];
  variant?: Variant;
  onChange?: (index: number) => void;
};

/**
 * Carousel's sub props to be passed to any component used by the carousel..
 */
export type SubProps = Required<Pick<Props, "children" | "variant">> & {
  emblaApi: UseEmblaCarouselType[1];
  currentIndex: number;
};
