import { ComponentProps } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";

// This should be somwhere else
export type ButtonAction = ComponentProps<typeof TouchableOpacity>["onPress"];

export type CarouselItemMetadata = {
  metadata: {
    id: number;
    displayed: boolean;

    onDismiss?: ButtonAction;
    onClick?: ButtonAction;
  };
};
