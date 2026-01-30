import type { ReactNode } from "react";
import { GestureResponderEvent } from "react-native";
import { AnyContentCard, ContentCardsType } from "../../dynamicContent/types";

export type ButtonAction = ((event?: GestureResponderEvent) => void) | undefined;

export type ContentCardProps = AnyContentCard & {
  metadata: ContentCardMetadata;
  itemStyle?: Record<string, unknown>;
  type: ContentCardsType;
};

export type ContentCardMetadata = {
  id: string;

  actions?: {
    onView?: () => void;
    onClick?: ButtonAction;
    onDismiss?: ButtonAction;
  };
};

/** Sync component type; content card components never return a Promise (avoids React 19 FC return type). */
export type ContentCardComponent<P extends ContentCardProps = ContentCardProps> = (
  props: P,
) => ReactNode;

/**
 * Defines a content card item.
 */
export interface ContentCardItem<P extends ContentCardProps = ContentCardProps> {
  component: ContentCardComponent<P & ContentCardProps>;
  props: P & ContentCardProps;
}
