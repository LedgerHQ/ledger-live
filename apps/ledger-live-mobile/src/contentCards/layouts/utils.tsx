import React from "react";
import { ContentCardProps } from "~/contentCards/cards/types";
import { ContentLayoutProps } from "~/contentCards/layouts/types";

export const ContentLayoutBuilder =
  <P extends object>(ContentLayoutComponent: React.FC<P & ContentLayoutProps<ContentCardProps>>) =>
  <T extends ContentCardProps>(props: P & ContentLayoutProps<T>) => (
    <ContentLayoutComponent {...(props as unknown as P & ContentLayoutProps<ContentCardProps>)} /> // Required force typings
  );
