import { ReactElement } from "react";
import { UseEmblaCarouselType } from "embla-carousel-react";

export type Variant = "content-card" | "default";

export type Props = {
  children: ReactElement[];
  autoPlay?: number;
  variant?: Variant;
  onPrev?: () => void;
  onNext?: () => void;
};

/**
 * Carousel's sub props to be passed to any component used by the carousel..
 */
export type SubProps = Required<Pick<Props, "children" | "variant">> & {
  emblaApi: UseEmblaCarouselType[1];
  currentIndex: number;
};
