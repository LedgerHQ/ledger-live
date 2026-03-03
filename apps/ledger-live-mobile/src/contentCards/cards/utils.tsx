import React from "react";
import {
  ContentCardProps,
  ContentCardItem,
  ContentCardComponent,
} from "~/contentCards/cards/types";

export const ContentCardBuilder =
  <P extends object>(ContentCardComponent: ContentCardComponent<P & ContentCardProps>) =>
  (props: P & ContentCardProps) => <ContentCardComponent {...props} />;

/**
 * Util function to create a content card item with proper typings that will be used in a layout.
 */
export const contentCardItem = <P extends ContentCardProps>(
  component: ContentCardComponent<P>,
  props: ContentCardItem<P>["props"],
) => {
  return {
    component,
    props,
  } as ContentCardItem<P>;
};
