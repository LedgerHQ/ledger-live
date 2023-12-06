import { ComponentProps } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";

// This should be somewhere else, but where ?
export type ButtonAction = ComponentProps<typeof TouchableOpacity>["onPress"];

/**
 * Defines the metadata associated with a content card.
 */
export type ContentCardMetadata = {
  metadata: {
    id: number;
    displayed: boolean;

    onDismiss?: ButtonAction;
    onClick?: ButtonAction;
  };
};
