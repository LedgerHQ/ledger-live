import { ContentCardItem, ContentCardProps } from "~/contentCards/cards/types";

export interface ContentLayoutProps<T extends ContentCardProps> {
  items: ContentCardItem<T>[];
}
