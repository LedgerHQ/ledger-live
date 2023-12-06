import { ContentCardMetadata } from "~/contentCards/types";

/**
 * Defines a carousel item.
 */
export interface CarouselItem<P = any> {
  component: React.FC<P>;
  props: ContentCardMetadata & P;
}
