import { ContentCardItem, ContentCardProps } from "~/contentCards/cards/types";

export interface ContentLayoutProps<T extends ContentCardProps> {
  items: ContentCardItem<T>[];
}

export enum WidthFactor {
  Full = 1,
  Half = 0.5,
  ThreeQuarters = 0.72,
}
