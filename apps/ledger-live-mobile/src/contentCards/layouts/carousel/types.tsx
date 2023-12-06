import { ContentCardMetadata } from "~/contentCards/types";

/**
 * Defines a carousel item.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CarouselItem<P = any> {
  component: React.FC<P>;
  props: ContentCardMetadata & P;
}
