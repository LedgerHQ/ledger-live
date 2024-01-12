import React, { useCallback } from "react";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button/index";
import { Button as UiButton } from "@ledgerhq/native-ui";
import { track } from "~/analytics";
import { TouchableOpacityProps } from "react-native";
import { GestureResponderEvent } from "react-native-modal";

export type WrappedButtonProps = ButtonProps & {
  event?: string;
  eventProperties?: unknown;
  buttonTestId?: string;
  onPressWhenDisabled?: TouchableOpacityProps["onPress"];
};

function Button({
  onPress,
  event,
  eventProperties,
  buttonTestId,
  ...othersProps
}: WrappedButtonProps) {
  const onPressHandler = useCallback(
    async (pressEvent: GestureResponderEvent) => {
      if (!onPress) return;
      if (event) {
        track(event, eventProperties as Record<string, unknown>);
      }
      onPress(pressEvent);
    },
    [event, eventProperties, onPress],
  );

  return <UiButton {...othersProps} onPress={onPressHandler} buttonTestId={buttonTestId} />;
}

export default Button;
