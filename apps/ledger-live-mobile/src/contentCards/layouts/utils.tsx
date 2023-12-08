import { ContentCardItem } from "~/contentCards/layouts/types";

/**
 * Util function to create a content card item with proper typings that will be used in a layout.
 */
export const contentCardItem = <P,>(component: React.FC<P>, props: ContentCardItem<P>["props"]) => {
  return {
    component,
    props,
  } as ContentCardItem<P>;
};
