import { ComponentProps } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";

export type ButtonAction = ComponentProps<typeof TouchableOpacity>["onPress"];

export type ContentCardProps = {
  metadata: ContentCardMetadata;
};

export type ContentCardMetadata = {
  id: string;

  actions?: {
    onView?: () => void;
    onClick?: ButtonAction;
    onDismiss?: ButtonAction;
  };
};

/**
 * Defines a content card item.
 */
export interface ContentCardItem<P extends ContentCardProps = ContentCardProps> {
  component: React.FC<P & ContentCardProps>;
  props: P & ContentCardProps;
}
